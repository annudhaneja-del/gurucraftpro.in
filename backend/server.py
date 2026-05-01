from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import hmac
import hashlib

try:
    import razorpay
except ImportError:
    razorpay = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'changeme')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@gurucraftpro.in')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Gurucraftpro')
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

razor_client = None
if razorpay and RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    try:
        razor_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except Exception:
        razor_client = None

app = FastAPI(title="GurucraftPro API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ---------- UTILS ----------
def utcnow():
    return datetime.now(timezone.utc)

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": utcnow() + timedelta(days=7),
        "iat": utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def admin_required(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

# ---------- MODELS ----------
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserOut

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    category: str
    short_desc: str
    description: str = ""
    price: float
    original_price: Optional[float] = None
    image: str = ""
    features: List[str] = []
    whatsapp_message: str = ""
    featured: bool = False
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class ServiceCreate(BaseModel):
    title: str
    slug: str
    category: str
    short_desc: str
    description: str = ""
    price: float
    original_price: Optional[float] = None
    image: str = ""
    features: List[str] = []
    whatsapp_message: str = ""
    featured: bool = False

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    description: str = ""
    price: float
    original_price: Optional[float] = None
    image: str = ""
    stock: int = 999
    file_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class ProductCreate(BaseModel):
    title: str
    category: str
    description: str = ""
    price: float
    original_price: Optional[float] = None
    image: str = ""
    stock: int = 999
    file_url: Optional[str] = None

class Testimonial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    rating: int = 5
    text: str
    avatar: str = ""
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class TestimonialCreate(BaseModel):
    name: str
    location: str
    rating: int = 5
    text: str
    avatar: str = ""

class GalleryImage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    image: str
    category: str = "general"
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class GalleryImageCreate(BaseModel):
    title: str
    image: str
    category: str = "general"

class LearningItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: Literal["pdf", "course", "prompt"] = "pdf"
    description: str = ""
    price: float = 0
    is_free: bool = False
    image: str = ""
    file_url: str = ""
    content: str = ""
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class LearningCreate(BaseModel):
    title: str
    type: Literal["pdf", "course", "prompt"] = "pdf"
    description: str = ""
    price: float = 0
    is_free: bool = False
    image: str = ""
    file_url: str = ""
    content: str = ""

class Template(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    thumbnail: str = ""
    data: dict = {}
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class TemplateCreate(BaseModel):
    name: str
    category: str
    thumbnail: str = ""
    data: dict = {}

class OrderItem(BaseModel):
    item_id: str
    item_type: Literal["service", "product", "learning"]
    title: str
    price: float
    qty: int = 1

class OrderCreate(BaseModel):
    items: List[OrderItem]
    coupon_code: Optional[str] = None
    customer_name: str
    customer_email: str
    customer_phone: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    items: List[OrderItem]
    subtotal: float
    discount: float = 0
    total: float
    status: Literal["pending", "paid", "cancelled", "shipped", "delivered"] = "pending"
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    customer_name: str
    customer_email: str
    customer_phone: str
    coupon_code: Optional[str] = None
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    percent: float
    active: bool = True
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class CouponCreate(BaseModel):
    code: str
    percent: float
    active: bool = True

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    subject: str = ""
    message: str
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str = ""
    message: str

class SavedDesign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    thumbnail: str = ""
    data: dict
    created_at: str = Field(default_factory=lambda: utcnow().isoformat())

class SavedDesignCreate(BaseModel):
    name: str
    thumbnail: str = ""
    data: dict

class RazorpayOrderReq(BaseModel):
    amount: float  # in INR rupees
    order_id: str

class RazorpayVerifyReq(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# ---------- AUTH ROUTES ----------
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "phone": data.phone,
        "password": hash_password(data.password),
        "role": "user",
        "created_at": utcnow().isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, "user")
    return {
        "token": token,
        "user": UserOut(id=user_id, name=data.name, email=data.email.lower(),
                        phone=data.phone, role="user", created_at=doc["created_at"])
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": UserOut(id=user["id"], name=user["name"], email=user["email"],
                        phone=user.get("phone"), role=user["role"], created_at=user["created_at"])
    }

@api_router.get("/auth/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return UserOut(**user)

# ---------- SERVICES ----------
@api_router.get("/services", response_model=List[Service])
async def list_services(category: Optional[str] = None, featured: Optional[bool] = None):
    q = {}
    if category:
        q["category"] = category
    if featured is not None:
        q["featured"] = featured
    items = await db.services.find(q, {"_id": 0}).to_list(500)
    return items

@api_router.get("/services/{slug}", response_model=Service)
async def get_service(slug: str):
    item = await db.services.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Service not found")
    return item

@api_router.post("/services", response_model=Service)
async def create_service(data: ServiceCreate, _=Depends(admin_required)):
    obj = Service(**data.model_dump())
    await db.services.insert_one(obj.model_dump())
    return obj

@api_router.put("/services/{service_id}", response_model=Service)
async def update_service(service_id: str, data: ServiceCreate, _=Depends(admin_required)):
    await db.services.update_one({"id": service_id}, {"$set": data.model_dump()})
    item = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, _=Depends(admin_required)):
    await db.services.delete_one({"id": service_id})
    return {"ok": True}

# ---------- PRODUCTS ----------
@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None, q: Optional[str] = None,
                        min_price: Optional[float] = None, max_price: Optional[float] = None):
    query = {}
    if category:
        query["category"] = category
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None:
            pr["$gte"] = min_price
        if max_price is not None:
            pr["$lte"] = max_price
        query["price"] = pr
    items = await db.products.find(query, {"_id": 0}).to_list(500)
    return items

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    item = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@api_router.post("/products", response_model=Product)
async def create_product(data: ProductCreate, _=Depends(admin_required)):
    obj = Product(**data.model_dump())
    await db.products.insert_one(obj.model_dump())
    return obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, data: ProductCreate, _=Depends(admin_required)):
    await db.products.update_one({"id": product_id}, {"$set": data.model_dump()})
    item = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, _=Depends(admin_required)):
    await db.products.delete_one({"id": product_id})
    return {"ok": True}

# ---------- TESTIMONIALS ----------
@api_router.get("/testimonials", response_model=List[Testimonial])
async def list_testimonials():
    items = await db.testimonials.find({}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/testimonials", response_model=Testimonial)
async def create_testimonial(data: TestimonialCreate, _=Depends(admin_required)):
    obj = Testimonial(**data.model_dump())
    await db.testimonials.insert_one(obj.model_dump())
    return obj

@api_router.delete("/testimonials/{tid}")
async def delete_testimonial(tid: str, _=Depends(admin_required)):
    await db.testimonials.delete_one({"id": tid})
    return {"ok": True}

# ---------- GALLERY ----------
@api_router.get("/gallery", response_model=List[GalleryImage])
async def list_gallery():
    items = await db.gallery.find({}, {"_id": 0}).to_list(200)
    return items

@api_router.post("/gallery", response_model=GalleryImage)
async def create_gallery(data: GalleryImageCreate, _=Depends(admin_required)):
    obj = GalleryImage(**data.model_dump())
    await db.gallery.insert_one(obj.model_dump())
    return obj

@api_router.delete("/gallery/{gid}")
async def delete_gallery(gid: str, _=Depends(admin_required)):
    await db.gallery.delete_one({"id": gid})
    return {"ok": True}

# ---------- LEARNING ----------
@api_router.get("/learning", response_model=List[LearningItem])
async def list_learning():
    items = await db.learning.find({}, {"_id": 0}).to_list(200)
    return items

@api_router.post("/learning", response_model=LearningItem)
async def create_learning(data: LearningCreate, _=Depends(admin_required)):
    obj = LearningItem(**data.model_dump())
    await db.learning.insert_one(obj.model_dump())
    return obj

@api_router.put("/learning/{lid}", response_model=LearningItem)
async def update_learning(lid: str, data: LearningCreate, _=Depends(admin_required)):
    await db.learning.update_one({"id": lid}, {"$set": data.model_dump()})
    item = await db.learning.find_one({"id": lid}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item

@api_router.delete("/learning/{lid}")
async def delete_learning(lid: str, _=Depends(admin_required)):
    await db.learning.delete_one({"id": lid})
    return {"ok": True}

# ---------- TEMPLATES (Canva) ----------
@api_router.get("/templates", response_model=List[Template])
async def list_templates(category: Optional[str] = None):
    q = {}
    if category:
        q["category"] = category
    items = await db.templates.find(q, {"_id": 0}).to_list(200)
    return items

@api_router.post("/templates", response_model=Template)
async def create_template(data: TemplateCreate, _=Depends(admin_required)):
    obj = Template(**data.model_dump())
    await db.templates.insert_one(obj.model_dump())
    return obj

@api_router.delete("/templates/{tid}")
async def delete_template(tid: str, _=Depends(admin_required)):
    await db.templates.delete_one({"id": tid})
    return {"ok": True}

# ---------- COUPONS ----------
@api_router.get("/coupons/validate")
async def validate_coupon(code: str):
    c = await db.coupons.find_one({"code": code.upper(), "active": True}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Invalid coupon")
    return c

@api_router.get("/coupons", response_model=List[Coupon])
async def list_coupons(_=Depends(admin_required)):
    items = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return items

@api_router.post("/coupons", response_model=Coupon)
async def create_coupon(data: CouponCreate, _=Depends(admin_required)):
    obj = Coupon(**data.model_dump())
    obj.code = obj.code.upper()
    await db.coupons.insert_one(obj.model_dump())
    return obj

@api_router.delete("/coupons/{cid}")
async def delete_coupon(cid: str, _=Depends(admin_required)):
    await db.coupons.delete_one({"id": cid})
    return {"ok": True}

# ---------- ORDERS ----------
@api_router.post("/orders", response_model=Order)
async def create_order(data: OrderCreate, creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    subtotal = sum(i.price * i.qty for i in data.items)
    discount = 0
    if data.coupon_code:
        c = await db.coupons.find_one({"code": data.coupon_code.upper(), "active": True})
        if c:
            discount = subtotal * (c["percent"] / 100)
    total = max(0, subtotal - discount)
    user_id = None
    if creds:
        try:
            payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
        except Exception:
            pass
    obj = Order(
        user_id=user_id,
        items=data.items,
        subtotal=subtotal,
        discount=discount,
        total=total,
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        customer_phone=data.customer_phone,
        coupon_code=data.coupon_code,
    )
    doc = obj.model_dump()
    # serialize items
    doc["items"] = [i.model_dump() if hasattr(i, "model_dump") else i for i in obj.items]
    await db.orders.insert_one(doc)
    return obj

@api_router.get("/orders/me", response_model=List[Order])
async def my_orders(user=Depends(get_current_user)):
    items = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api_router.get("/orders", response_model=List[Order])
async def list_orders(_=Depends(admin_required)):
    items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status_val: str, _=Depends(admin_required)):
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status_val}})
    return {"ok": True}

# ---------- RAZORPAY ----------
@api_router.get("/payments/config")
async def payment_config():
    return {"enabled": bool(razor_client), "key_id": RAZORPAY_KEY_ID if razor_client else ""}

@api_router.post("/payments/create-order")
async def create_payment_order(data: RazorpayOrderReq):
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    amount_paise = int(round(data.amount * 100))
    if razor_client:
        razor_order = razor_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,
            "receipt": data.order_id[:40],
        })
        await db.orders.update_one({"id": data.order_id}, {"$set": {"razorpay_order_id": razor_order["id"]}})
        return {"razorpay_order_id": razor_order["id"], "amount": amount_paise, "key_id": RAZORPAY_KEY_ID, "mock": False}
    # Mock fallback when no keys configured
    mock_id = f"order_mock_{uuid.uuid4().hex[:16]}"
    await db.orders.update_one({"id": data.order_id}, {"$set": {"razorpay_order_id": mock_id}})
    return {"razorpay_order_id": mock_id, "amount": amount_paise, "key_id": "", "mock": True}

@api_router.post("/payments/verify")
async def verify_payment(data: RazorpayVerifyReq):
    if razor_client:
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, data.razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid signature")
    await db.orders.update_one(
        {"id": data.order_id},
        {"$set": {"status": "paid", "payment_id": data.razorpay_payment_id}},
    )
    return {"ok": True, "status": "paid"}

# ---------- CONTACT ----------
@api_router.post("/contact", response_model=ContactMessage)
async def post_contact(data: ContactCreate):
    obj = ContactMessage(**data.model_dump())
    await db.contacts.insert_one(obj.model_dump())
    return obj

@api_router.get("/contact", response_model=List[ContactMessage])
async def list_contact(_=Depends(admin_required)):
    items = await db.contacts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

# ---------- SAVED DESIGNS ----------
@api_router.get("/designs", response_model=List[SavedDesign])
async def list_designs(user=Depends(get_current_user)):
    items = await db.designs.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api_router.post("/designs", response_model=SavedDesign)
async def save_design(data: SavedDesignCreate, user=Depends(get_current_user)):
    obj = SavedDesign(user_id=user["id"], **data.model_dump())
    await db.designs.insert_one(obj.model_dump())
    return obj

@api_router.delete("/designs/{did}")
async def delete_design(did: str, user=Depends(get_current_user)):
    await db.designs.delete_one({"id": did, "user_id": user["id"]})
    return {"ok": True}

# ---------- ADMIN ANALYTICS ----------
@api_router.get("/admin/stats")
async def admin_stats(_=Depends(admin_required)):
    users = await db.users.count_documents({})
    orders = await db.orders.count_documents({})
    paid = await db.orders.count_documents({"status": "paid"})
    services = await db.services.count_documents({})
    products = await db.products.count_documents({})
    contacts = await db.contacts.count_documents({})
    rev_docs = await db.orders.find({"status": "paid"}, {"_id": 0, "total": 1}).to_list(5000)
    revenue = sum(d.get("total", 0) for d in rev_docs)
    return {
        "users": users, "orders": orders, "paid_orders": paid,
        "services": services, "products": products,
        "contacts": contacts, "revenue": revenue,
    }

@api_router.get("/admin/users")
async def admin_users(_=Depends(admin_required)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/")
async def root():
    return {"message": "GurucraftPro API", "status": "live"}

# ---------- FILE UPLOAD ----------
ALLOWED_EXT = {"png", "jpg", "jpeg", "webp", "gif", "pdf", "svg"}
ALLOWED_IMG_EXT = {"png", "jpg", "jpeg", "webp", "gif"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), _=Depends(admin_required)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "").lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    name = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / name
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    dest.write_bytes(content)
    return {"url": f"/api/uploads/{name}", "filename": name, "size": len(content)}

@api_router.post("/upload/creator")
async def upload_creator_sample(file: UploadFile = File(...)):
    """Public upload for creator submission samples — images only, 5MB cap."""
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "").lower()
    if ext not in ALLOWED_IMG_EXT:
        raise HTTPException(status_code=400, detail=f"Only images allowed: {', '.join(ALLOWED_IMG_EXT)}")
    name = f"creator_{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / name
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    dest.write_bytes(content)
    return {"url": f"/api/uploads/{name}", "filename": name, "size": len(content)}

# ---------- HOMEPAGE SETTINGS ----------
DEFAULT_SETTINGS = {
    "hero_title_line1": "Creative designs &",
    "hero_title_line2": "digital services",
    "hero_title_line3": "tailored for every need",
    "hero_subtitle": "From wedding invites and Guruji frames to complete e-commerce stores, AI prompts and Canva-style design tools — GurucraftPro is your one-stop creative studio in Rohini, Delhi.",
    "about_heading": "Crafted with love by Annu Dhaneja",
    "about_para1": "For over 7 years, GurucraftPro has been Rohini's go-to creative studio — blending traditional Indian aesthetics with cutting-edge digital craft.",
    "about_para2": "Whether you need a spiritual Guruji frame, a Canva-style design tool, or a full D2C store launch — we bring craftsmanship, technology, and heart together.",
    "stat_clients": 500,
    "stat_orders": 1200,
    "stat_years": 7,
    "phone": "+918527837527",
    "whatsapp": "+918527837527",
    "email": "annudhaneja@gmail.com",
    "address": "Rohini, Delhi - 110085",
    "hours": "8 AM – 8 PM",
}

class HomepageSettings(BaseModel):
    hero_title_line1: str = DEFAULT_SETTINGS["hero_title_line1"]
    hero_title_line2: str = DEFAULT_SETTINGS["hero_title_line2"]
    hero_title_line3: str = DEFAULT_SETTINGS["hero_title_line3"]
    hero_subtitle: str = DEFAULT_SETTINGS["hero_subtitle"]
    about_heading: str = DEFAULT_SETTINGS["about_heading"]
    about_para1: str = DEFAULT_SETTINGS["about_para1"]
    about_para2: str = DEFAULT_SETTINGS["about_para2"]
    stat_clients: int = DEFAULT_SETTINGS["stat_clients"]
    stat_orders: int = DEFAULT_SETTINGS["stat_orders"]
    stat_years: int = DEFAULT_SETTINGS["stat_years"]
    phone: str = DEFAULT_SETTINGS["phone"]
    whatsapp: str = DEFAULT_SETTINGS["whatsapp"]
    email: str = DEFAULT_SETTINGS["email"]
    address: str = DEFAULT_SETTINGS["address"]
    hours: str = DEFAULT_SETTINGS["hours"]

@api_router.get("/settings/homepage", response_model=HomepageSettings)
async def get_settings():
    doc = await db.settings.find_one({"key": "homepage"}, {"_id": 0})
    if not doc:
        return HomepageSettings()
    return HomepageSettings(**{k: v for k, v in doc.items() if k != "key"})

@api_router.put("/settings/homepage", response_model=HomepageSettings)
async def update_settings(data: HomepageSettings, _=Depends(admin_required)):
    doc = data.model_dump()
    doc["key"] = "homepage"
    await db.settings.update_one({"key": "homepage"}, {"$set": doc}, upsert=True)
    return data

# ---------- USER PROFILE ----------
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

@api_router.put("/auth/me", response_model=UserOut)
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    update_doc = {}
    if data.name:
        update_doc["name"] = data.name
    if data.phone is not None:
        update_doc["phone"] = data.phone
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Current password required")
        full = await db.users.find_one({"id": user["id"]})
        if not verify_password(data.current_password, full["password"]):
            raise HTTPException(status_code=400, detail="Current password incorrect")
        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 chars")
        update_doc["password"] = hash_password(data.new_password)
    if update_doc:
        await db.users.update_one({"id": user["id"]}, {"$set": update_doc})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return UserOut(**updated)

# ---------- ADMIN USER MANAGEMENT ----------
class RoleUpdate(BaseModel):
    role: Literal["user", "admin"]

@api_router.put("/admin/users/{user_id}/role")
async def set_user_role(user_id: str, data: RoleUpdate, admin=Depends(admin_required)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    await db.users.update_one({"id": user_id}, {"$set": {"role": data.role}})
    return {"ok": True}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(admin_required)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.users.delete_one({"id": user_id})
    return {"ok": True}

# ---------- CATEGORIES ----------
@api_router.get("/categories")
async def list_categories():
    s = await db.services.distinct("category")
    p = await db.products.distinct("category")
    g = await db.gallery.distinct("category")
    t = await db.templates.distinct("category")
    return {"services": s, "products": p, "gallery": g, "templates": t}

# ---------- DOWNLOADS ----------
@api_router.get("/downloads/me")
async def my_downloads(user=Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"], "status": "paid"}, {"_id": 0}).to_list(500)
    downloads = []
    for o in orders:
        for it in o.get("items", []):
            if it.get("item_type") in ("product", "learning"):
                # Look up file_url from source collection
                coll = db.products if it["item_type"] == "product" else db.learning
                src = await coll.find_one({"id": it["item_id"]}, {"_id": 0, "file_url": 1, "image": 1})
                downloads.append({
                    "order_id": o["id"],
                    "title": it["title"],
                    "type": it["item_type"],
                    "image": (src or {}).get("image", ""),
                    "file_url": (src or {}).get("file_url", ""),
                    "date": o.get("created_at", ""),
                })
    return downloads

# ---------- AR / TRY-ON ----------
@api_router.get("/tryon/clothing")
async def tryon_clothing():
    items = await db.products.find({"category": "Clothing"}, {"_id": 0}).to_list(100)
    return items

@api_router.get("/tryon/artwork")
async def tryon_artwork():
    items = await db.products.find({"category": {"$in": ["Spiritual", "Wall Art", "Wedding"]}}, {"_id": 0}).to_list(100)
    return items

class LookCreate(BaseModel):
    name: str
    thumbnail: str
    mode: Literal["dressing", "artwork"]
    meta: dict = {}

@api_router.post("/looks")
async def create_look(data: LookCreate, user=Depends(get_current_user)):
    obj = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": data.name,
        "thumbnail": data.thumbnail,
        "mode": data.mode,
        "meta": data.meta,
        "created_at": utcnow().isoformat(),
    }
    await db.looks.insert_one(obj)
    obj.pop("_id", None)
    return obj

@api_router.get("/looks/me")
async def my_looks(user=Depends(get_current_user)):
    items = await db.looks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items

@api_router.delete("/looks/{look_id}")
async def delete_look(look_id: str, user=Depends(get_current_user)):
    await db.looks.delete_one({"id": look_id, "user_id": user["id"]})
    return {"ok": True}

# ---------- CREATOR SUBMISSIONS (Sell) ----------
class CreatorSubmission(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    content_type: Literal["prompt_pack", "template", "pdf_course", "artwork", "clothing", "other"]
    title: str
    description: str
    price: float = 0
    sample_url: Optional[str] = None
    portfolio_url: Optional[str] = None

@api_router.post("/creators/submit")
async def submit_creator_content(data: CreatorSubmission):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "created_at": utcnow().isoformat(),
    }
    await db.creator_submissions.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/creators/submissions")
async def list_creator_submissions(_=Depends(admin_required)):
    items = await db.creator_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.put("/creators/submissions/{sub_id}/status")
async def update_creator_status(sub_id: str, status_val: Literal["pending", "approved", "rejected"], _=Depends(admin_required)):
    await db.creator_submissions.update_one({"id": sub_id}, {"$set": {"status": status_val}})
    return {"ok": True}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- SEED ----------
@app.on_event("startup")
async def seed_data():
    # Update Guruji Art Works image to new portrait if it still uses the old URL (one-time migration)
    new_guruji = "https://customer-assets.emergentagent.com/job_craftpro-services/artifacts/qfqd193x_tmp_8573562d-5d66-4082-af3e-8a6292a431ad.jpeg"
    await db.services.update_many(
        {"slug": "guruji-art-works"},
        {"$set": {"image": new_guruji}},
    )
    await db.products.update_many(
        {"title": "Guruji Devotional Poster Set"},
        {"$set": {"image": new_guruji}},
    )
    await db.gallery.update_many(
        {"title": "Guruji Frame"},
        {"$set": {"image": new_guruji}},
    )

    # Seed admin
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Annu Dhaneja",
            "email": ADMIN_EMAIL,
            "phone": "+918527837527",
            "password": hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "created_at": utcnow().isoformat(),
        })
        logger.info(f"Seeded admin {ADMIN_EMAIL}")

    # Seed services
    if await db.services.count_documents({}) == 0:
        services = [
            {
                "title": "7 Day Consultation",
                "slug": "7-day-consultation",
                "category": "Consultation",
                "short_desc": "Personalised 7-day creative strategy & branding consultation",
                "description": "Get a full 7-day hands-on consultation to transform your brand. Daily 1-on-1 sessions, deliverables, and a complete brand roadmap.",
                "price": 4999, "original_price": 7999,
                "image": "https://images.unsplash.com/photo-1758872014929-174e4ccdf01f?crop=entropy&cs=srgb&fm=jpg&q=85",
                "features": ["7 Daily 1-on-1 sessions", "Brand audit report", "Social media plan", "WhatsApp support"],
                "whatsapp_message": "Hi, I want to book the 7 Day Consultation",
                "featured": True,
            },
            {
                "title": "Wedding Planner",
                "slug": "wedding-planner",
                "category": "Events",
                "short_desc": "Premium wedding invitation design, branding & digital planning",
                "description": "Elegant wedding invites, save-the-dates, welcome videos, and complete digital wedding suite — designed with love.",
                "price": 14999, "original_price": 24999,
                "image": "https://images.unsplash.com/photo-1766393030563-fc2e2ef87acb?crop=entropy&cs=srgb&fm=jpg&q=85",
                "features": ["Custom invite designs", "Save-the-date cards", "Wedding logo", "Digital RSVP"],
                "whatsapp_message": "Hi, I'm interested in Wedding Planner service",
                "featured": True,
            },
            {
                "title": "Guruji Art Works",
                "slug": "guruji-art-works",
                "category": "Spiritual",
                "short_desc": "Devotional posters, spiritual frames & Guruji tribute artworks",
                "description": "Sacred artworks, devotional posters, and framed Guruji portraits — crafted with reverence and premium print quality.",
                "price": 1499, "original_price": 2999,
                "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/90y404uo_IMG-20260313-WA0029.jpg",
                "features": ["Premium framing", "HD print", "Sanskrit calligraphy", "Doorstep delivery"],
                "whatsapp_message": "Hi, I want Guruji Art Works",
                "featured": True,
            },
            {
                "title": "VantageEcom",
                "slug": "vantage-ecom",
                "category": "E-commerce",
                "short_desc": "Full e-commerce store setup, product photos & catalogues",
                "description": "Launch your online store in 7 days — product photography, catalogue design, store setup on Shopify/Amazon/Flipkart.",
                "price": 19999, "original_price": 29999,
                "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/00ouwg4m_images_1_tkxu3j.jpg",
                "features": ["Product photography", "Catalogue design", "Store setup", "Launch marketing"],
                "whatsapp_message": "Hi, I need help with VantageEcom store setup",
                "featured": True,
            },
            {
                "title": "Image Editing & Retouching",
                "slug": "image-editing",
                "category": "Design",
                "short_desc": "Professional photo retouching, background removal & colour grading",
                "description": "Studio-grade editing for your photos — background removal, retouching, colour grading, fast turnaround.",
                "price": 299, "original_price": 499,
                "image": "https://images.unsplash.com/photo-1765539160785-e7953620488f?crop=entropy&cs=srgb&fm=jpg&q=85",
                "features": ["24hr turnaround", "Unlimited revisions", "Bulk discount", "HD export"],
                "whatsapp_message": "Hi, I need image editing",
                "featured": False,
            },
            {
                "title": "Learning Membership",
                "slug": "learning-membership",
                "category": "Learning",
                "short_desc": "Unlimited access to design courses, AI prompts & PDF guides",
                "description": "Premium membership unlocks every course, every PDF, every prompt pack we build.",
                "price": 999, "original_price": 2499,
                "image": "https://images.unsplash.com/photo-1758872014929-174e4ccdf01f?crop=entropy&cs=srgb&fm=jpg&q=85",
                "features": ["All courses", "All PDFs", "All prompts", "Monthly updates"],
                "whatsapp_message": "Hi, I want to join Learning Membership",
                "featured": False,
            },
        ]
        for s in services:
            s["id"] = str(uuid.uuid4())
            s["created_at"] = utcnow().isoformat()
        await db.services.insert_many(services)
        logger.info(f"Seeded {len(services)} services")

    # Seed products
    if await db.products.count_documents({}) == 0:
        products = [
            {"title": "Instagram Reel Pack (30 Templates)", "category": "Social Media", "description": "30 premium editable reel templates", "price": 499, "original_price": 999, "image": "https://images.unsplash.com/photo-1765539160785-e7953620488f?crop=entropy&cs=srgb&fm=jpg&q=85", "stock": 999, "file_url": ""},
            {"title": "Wedding Invitation Mega Bundle", "category": "Wedding", "description": "100+ invite templates, RSVP cards, thank-you cards", "price": 799, "original_price": 1999, "image": "https://images.unsplash.com/photo-1766393030563-fc2e2ef87acb?crop=entropy&cs=srgb&fm=jpg&q=85", "stock": 999, "file_url": ""},
            {"title": "Guruji Devotional Poster Set", "category": "Spiritual", "description": "HD printable devotional posters — 12 designs", "price": 299, "original_price": 599, "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/90y404uo_IMG-20260313-WA0029.jpg", "stock": 999, "file_url": ""},
            {"title": "E-commerce Product Photo Preset", "category": "E-commerce", "description": "Lightroom presets for product photography", "price": 399, "original_price": 799, "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/00ouwg4m_images_1_tkxu3j.jpg", "stock": 999, "file_url": ""},
            {"title": "AI Prompt Pack — Midjourney 500+", "category": "AI", "description": "500+ hand-tested Midjourney prompts", "price": 599, "original_price": 1299, "image": "https://images.unsplash.com/photo-1758872014929-174e4ccdf01f?crop=entropy&cs=srgb&fm=jpg&q=85", "stock": 999, "file_url": ""},
            {"title": "Logo Design Mega Pack", "category": "Design", "description": "250 customisable logo templates", "price": 699, "original_price": 1499, "image": "https://images.unsplash.com/photo-1765539160785-e7953620488f?crop=entropy&cs=srgb&fm=jpg&q=85", "stock": 999, "file_url": ""},
        ]
        for p in products:
            p["id"] = str(uuid.uuid4())
            p["created_at"] = utcnow().isoformat()
        await db.products.insert_many(products)
        logger.info(f"Seeded {len(products)} products")

    # Seed testimonials
    if await db.testimonials.count_documents({}) == 0:
        t = [
            {"name": "Priya Sharma", "location": "Rohini, Delhi", "rating": 5, "text": "Annu ji made our wedding invites so beautiful, guests still talk about them!", "avatar": ""},
            {"name": "Rahul Verma", "location": "Pitampura, Delhi", "rating": 5, "text": "VantageEcom setup doubled my sales in 2 months. Highly recommended.", "avatar": ""},
            {"name": "Neha Aggarwal", "location": "Gurgaon", "rating": 5, "text": "The Guruji frames arrived beautifully packed. Divine work!", "avatar": ""},
            {"name": "Vikram Singh", "location": "Noida", "rating": 5, "text": "The 7-day consultation transformed my brand. Worth every rupee.", "avatar": ""},
        ]
        for x in t:
            x["id"] = str(uuid.uuid4())
            x["created_at"] = utcnow().isoformat()
        await db.testimonials.insert_many(t)
        logger.info(f"Seeded {len(t)} testimonials")

    # Seed gallery
    if await db.gallery.count_documents({}) == 0:
        g = [
            {"title": "Neon Studio", "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/1z5p7qlm_tmp_8573562d-5d66-4082-af3e-8a6292a431ad.jpeg", "category": "studio"},
            {"title": "Virtual Try-On", "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/00ouwg4m_images_1_tkxu3j.jpg", "category": "ecom"},
            {"title": "Guruji Frame", "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/90y404uo_IMG-20260313-WA0029.jpg", "category": "spiritual"},
            {"title": "Wedding Decor", "image": "https://images.unsplash.com/photo-1766393030563-fc2e2ef87acb?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "wedding"},
            {"title": "Design Workspace", "image": "https://images.unsplash.com/photo-1765539160785-e7953620488f?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "design"},
            {"title": "Wedding Bundle", "image": "https://images.unsplash.com/photo-1764509195128-e2f389ac3235?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "wedding"},
            {"title": "Learning Hub", "image": "https://images.unsplash.com/photo-1758872014929-174e4ccdf01f?crop=entropy&cs=srgb&fm=jpg&q=85", "category": "learning"},
        ]
        for x in g:
            x["id"] = str(uuid.uuid4())
            x["created_at"] = utcnow().isoformat()
        await db.gallery.insert_many(g)
        logger.info(f"Seeded {len(g)} gallery items")

    # Seed learning
    if await db.learning.count_documents({}) == 0:
        learn_items = [
            {"title": "Canva Mastery Course (Free)", "type": "course", "description": "Learn Canva from zero to pro in 3 hours", "price": 0, "is_free": True, "image": "https://images.unsplash.com/photo-1758872014929-174e4ccdf01f?crop=entropy&cs=srgb&fm=jpg&q=85", "file_url": "", "content": "Module 1: Basics..."},
            {"title": "50 AI Prompts for Designers", "type": "prompt", "description": "50 battle-tested AI prompts", "price": 299, "is_free": False, "image": "https://images.unsplash.com/photo-1765539160785-e7953620488f?crop=entropy&cs=srgb&fm=jpg&q=85", "file_url": "", "content": "1. cinematic lighting, hyperreal..."},
            {"title": "E-commerce Launch Guide PDF", "type": "pdf", "description": "Complete step-by-step PDF", "price": 499, "is_free": False, "image": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/00ouwg4m_images_1_tkxu3j.jpg", "file_url": "", "content": ""},
            {"title": "Wedding Design Playbook", "type": "pdf", "description": "Free wedding design playbook", "price": 0, "is_free": True, "image": "https://images.unsplash.com/photo-1766393030563-fc2e2ef87acb?crop=entropy&cs=srgb&fm=jpg&q=85", "file_url": "", "content": ""},
        ]
        for x in learn_items:
            x["id"] = str(uuid.uuid4())
            x["created_at"] = utcnow().isoformat()
        await db.learning.insert_many(learn_items)
        logger.info(f"Seeded {len(learn_items)} learning items")

    # Seed templates
    if await db.templates.count_documents({}) == 0:
        tmpl = [
            {"name": "Instagram Post — Neon", "category": "Social Media", "thumbnail": "https://images.unsplash.com/photo-1765539160785-e7953620488f?crop=entropy&cs=srgb&fm=jpg&q=85", "data": {"width": 1080, "height": 1080, "background": "#05050A", "elements": [{"type": "text", "text": "Your Neon Vibe", "x": 120, "y": 420, "fontSize": 96, "color": "#7c3aed", "fontFamily": "Playfair Display"}, {"type": "rect", "x": 80, "y": 600, "w": 400, "h": 8, "color": "#14b8a6"}]}},
            {"name": "Wedding Invite — Royal", "category": "Wedding", "thumbnail": "https://images.unsplash.com/photo-1766393030563-fc2e2ef87acb?crop=entropy&cs=srgb&fm=jpg&q=85", "data": {"width": 1080, "height": 1350, "background": "#12121A", "elements": [{"type": "text", "text": "Annu & Raj", "x": 200, "y": 500, "fontSize": 110, "color": "#ffffff", "fontFamily": "Playfair Display"}, {"type": "text", "text": "Save the Date", "x": 360, "y": 700, "fontSize": 44, "color": "#14b8a6", "fontFamily": "Outfit"}]}},
            {"name": "Guruji Quote Poster", "category": "Spiritual", "thumbnail": "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/90y404uo_IMG-20260313-WA0029.jpg", "data": {"width": 1080, "height": 1080, "background": "#05050A", "elements": [{"type": "text", "text": "Jai Guruji", "x": 300, "y": 450, "fontSize": 120, "color": "#7c3aed", "fontFamily": "Playfair Display"}]}},
            {"name": "Business Banner", "category": "Business", "thumbnail": "https://images.unsplash.com/photo-1758872014929-174e4ccdf01f?crop=entropy&cs=srgb&fm=jpg&q=85", "data": {"width": 1600, "height": 600, "background": "#12121A", "elements": [{"type": "text", "text": "Grand Opening", "x": 200, "y": 250, "fontSize": 120, "color": "#14b8a6", "fontFamily": "Playfair Display"}]}},
        ]
        for x in tmpl:
            x["id"] = str(uuid.uuid4())
            x["created_at"] = utcnow().isoformat()
        await db.templates.insert_many(tmpl)
        logger.info(f"Seeded {len(tmpl)} templates")

    # Seed clothing + artwork products for AR try-on (one-time)
    if await db.products.count_documents({"category": "Clothing"}) == 0:
        clothing = [
            {"title": "Neon Neru Tee", "category": "Clothing", "description": "Premium crew-neck tee — neon purple accent", "price": 699, "original_price": 1299, "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Royal Kurta", "category": "Clothing", "description": "Festive kurta for men", "price": 1499, "original_price": 2499, "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Designer Saree", "category": "Clothing", "description": "Teal-toned designer saree", "price": 2999, "original_price": 4999, "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Denim Jacket", "category": "Clothing", "description": "Classic denim jacket", "price": 1999, "original_price": 2999, "image": "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Graphic Hoodie", "category": "Clothing", "description": "Neon graphic hoodie", "price": 1299, "original_price": 1999, "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Ethnic Sherwani", "category": "Clothing", "description": "Wedding sherwani with dupatta", "price": 4999, "original_price": 7999, "image": "https://images.unsplash.com/photo-1594938374182-a57061deaf3b?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
        ]
        for c in clothing:
            c["id"] = str(uuid.uuid4())
            c["created_at"] = utcnow().isoformat()
        await db.products.insert_many(clothing)
        logger.info(f"Seeded {len(clothing)} clothing items")

    if await db.products.count_documents({"category": "Wall Art"}) == 0:
        artwork = [
            {"title": "Guruji Framed Portrait", "category": "Wall Art", "description": "Premium framed devotional portrait", "price": 1999, "original_price": 2999, "image": "https://customer-assets.emergentagent.com/job_craftpro-services/artifacts/qfqd193x_tmp_8573562d-5d66-4082-af3e-8a6292a431ad.jpeg", "stock": 999},
            {"title": "Om Sacred Wall Poster", "category": "Wall Art", "description": "Minimalist Om wall art", "price": 799, "original_price": 1299, "image": "https://images.unsplash.com/photo-1618221941543-3e2094e23bd7?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Ganesha Canvas Print", "category": "Wall Art", "description": "Lord Ganesha canvas print", "price": 1499, "original_price": 2299, "image": "https://images.unsplash.com/photo-1578762560042-46ad127c95ea?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Mandala Wall Art", "category": "Wall Art", "description": "Intricate mandala wall art", "price": 999, "original_price": 1799, "image": "https://images.unsplash.com/photo-1582582621959-48d27397dc69?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Buddha Zen Frame", "category": "Wall Art", "description": "Calming Buddha frame", "price": 1299, "original_price": 1999, "image": "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
            {"title": "Radha Krishna Canvas", "category": "Wall Art", "description": "Radha Krishna large canvas", "price": 2499, "original_price": 3999, "image": "https://images.unsplash.com/photo-1604848698030-c434ba08ece1?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "stock": 999},
        ]
        for a in artwork:
            a["id"] = str(uuid.uuid4())
            a["created_at"] = utcnow().isoformat()
        await db.products.insert_many(artwork)
        logger.info(f"Seeded {len(artwork)} wall art items")

    # Seed coupons
    if await db.coupons.count_documents({}) == 0:
        await db.coupons.insert_many([
            {"id": str(uuid.uuid4()), "code": "WELCOME10", "percent": 10, "active": True, "created_at": utcnow().isoformat()},
            {"id": str(uuid.uuid4()), "code": "GURUJI25", "percent": 25, "active": True, "created_at": utcnow().isoformat()},
        ])
        logger.info("Seeded coupons")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
