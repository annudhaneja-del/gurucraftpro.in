"""GurucraftPro backend pytest suite."""
import os
import uuid
import hmac
import hashlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://craftpro-services.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@gurucraftpro.in"
ADMIN_PASSWORD = "Gurucraftpro"
# Match backend .env - used to compute valid HMAC when razorpay real-mode is enabled
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "uf7Y29x0Ir4rv9d3COs4zawf")


def _sign(order_id, payment_id):
    return hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()


def _no_mongo_id(obj):
    if isinstance(obj, list):
        return all(_no_mongo_id(o) for o in obj)
    if isinstance(obj, dict):
        if "_id" in obj:
            return False
        return all(_no_mongo_id(v) for v in obj.values())
    return True


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def user_token(s):
    email = f"test_{uuid.uuid4().hex[:8]}@gurucraftpro.in"
    r = s.post(f"{API}/auth/register", json={
        "name": "Test User", "email": email, "password": "Test@1234", "phone": "+919999999999"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return data["token"], data["user"], email


@pytest.fixture(scope="session")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token[0]}"}


# ---------- Health ----------
class TestHealth:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "live"


# ---------- Auth ----------
class TestAuth:
    def test_admin_login(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and d["user"]["role"] == "admin"
        assert _no_mongo_id(d)

    def test_invalid_login(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_register_and_me(self, s, user_token):
        token, user, _ = user_token
        r = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == user["email"]

    def test_me_unauth(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Services ----------
class TestServices:
    def test_list_services(self, s):
        r = s.get(f"{API}/services")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 6
        assert _no_mongo_id(items)
        for it in items:
            assert {"id", "title", "slug", "price", "category"} <= set(it.keys())

    def test_get_service_by_slug(self, s):
        r = s.get(f"{API}/services/7-day-consultation")
        assert r.status_code == 200
        assert r.json()["slug"] == "7-day-consultation"

    def test_create_service_non_admin_403(self, s, user_headers):
        r = s.post(f"{API}/services", headers=user_headers, json={
            "title": "X", "slug": "x", "category": "c", "short_desc": "s", "price": 1
        })
        assert r.status_code == 403

    def test_admin_crud_service(self, s, admin_headers):
        slug = f"test-svc-{uuid.uuid4().hex[:6]}"
        payload = {"title": "TEST_Svc", "slug": slug, "category": "test", "short_desc": "x", "price": 100}
        r = s.post(f"{API}/services", headers=admin_headers, json=payload)
        assert r.status_code == 200
        sid = r.json()["id"]

        # update
        payload["title"] = "TEST_Svc_Upd"
        r = s.put(f"{API}/services/{sid}", headers=admin_headers, json=payload)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_Svc_Upd"

        # delete
        r = s.delete(f"{API}/services/{sid}", headers=admin_headers)
        assert r.status_code == 200


# ---------- Products ----------
class TestProducts:
    def test_list_products(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 6
        assert _no_mongo_id(items)

    def test_filters(self, s):
        r = s.get(f"{API}/products", params={"q": "Wedding"})
        assert r.status_code == 200
        items = r.json()
        assert all("wedding" in p["title"].lower() for p in items)

        r = s.get(f"{API}/products", params={"min_price": 500, "max_price": 800})
        assert r.status_code == 200
        for p in r.json():
            assert 500 <= p["price"] <= 800

    def test_admin_crud_product(self, s, admin_headers):
        r = s.post(f"{API}/products", headers=admin_headers, json={
            "title": "TEST_Prod", "category": "test", "price": 99
        })
        assert r.status_code == 200
        pid = r.json()["id"]
        r = s.put(f"{API}/products/{pid}", headers=admin_headers, json={
            "title": "TEST_Prod_Upd", "category": "test", "price": 199
        })
        assert r.status_code == 200 and r.json()["price"] == 199
        r = s.delete(f"{API}/products/{pid}", headers=admin_headers)
        assert r.status_code == 200


# ---------- Misc list endpoints ----------
class TestPublicLists:
    def test_testimonials(self, s):
        r = s.get(f"{API}/testimonials")
        assert r.status_code == 200 and len(r.json()) >= 4
        assert _no_mongo_id(r.json())

    def test_gallery(self, s):
        r = s.get(f"{API}/gallery")
        assert r.status_code == 200 and len(r.json()) >= 1
        assert _no_mongo_id(r.json())

    def test_learning(self, s):
        r = s.get(f"{API}/learning")
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_templates(self, s):
        r = s.get(f"{API}/templates")
        assert r.status_code == 200 and len(r.json()) >= 1

    def test_coupon_validate(self, s):
        r = s.get(f"{API}/coupons/validate", params={"code": "WELCOME10"})
        assert r.status_code == 200 and r.json()["percent"] == 10

    def test_coupon_invalid(self, s):
        r = s.get(f"{API}/coupons/validate", params={"code": "NOPE"})
        assert r.status_code == 404


# ---------- Orders & Payments ----------
class TestOrdersPayments:
    def test_order_with_coupon(self, s, user_headers):
        items = [{"item_id": "x", "item_type": "service", "title": "Svc", "price": 1000, "qty": 2}]
        r = s.post(f"{API}/orders", headers=user_headers, json={
            "items": items, "coupon_code": "WELCOME10",
            "customer_name": "T", "customer_email": "t@x.com", "customer_phone": "+91"
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["subtotal"] == 2000
        assert d["discount"] == 200
        assert d["total"] == 1800
        oid = d["id"]

        # payment create-order (real or mock based on env)
        r = s.post(f"{API}/payments/create-order", json={"amount": 1800, "order_id": oid})
        assert r.status_code == 200
        pd = r.json()
        assert "razorpay_order_id" in pd
        # If mock mode, accepts any signature; if real, compute valid HMAC
        pay_id = "pay_mock_xyz"
        sig = "mock_sig" if pd.get("mock") else _sign(pd["razorpay_order_id"], pay_id)

        # verify
        r = s.post(f"{API}/payments/verify", json={
            "order_id": oid, "razorpay_order_id": pd["razorpay_order_id"],
            "razorpay_payment_id": pay_id, "razorpay_signature": sig
        })
        assert r.status_code == 200 and r.json()["status"] == "paid"

        # /orders/me
        r = s.get(f"{API}/orders/me", headers=user_headers)
        assert r.status_code == 200
        assert any(o["id"] == oid and o["status"] == "paid" for o in r.json())

    def test_admin_orders(self, s, admin_headers):
        r = s.get(f"{API}/orders", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Contact ----------
class TestContact:
    def test_contact_post_and_admin_list(self, s, admin_headers):
        r = s.post(f"{API}/contact", json={
            "name": "TEST_C", "email": "c@x.com", "subject": "Hi", "message": "Hello"
        })
        assert r.status_code == 200
        cid = r.json()["id"]
        r = s.get(f"{API}/contact", headers=admin_headers)
        assert r.status_code == 200
        assert any(c["id"] == cid for c in r.json())

    def test_contact_admin_only(self, s, user_headers):
        r = s.get(f"{API}/contact", headers=user_headers)
        assert r.status_code == 403


# ---------- Designs ----------
class TestDesigns:
    def test_designs_crud(self, s, user_headers):
        r = s.post(f"{API}/designs", headers=user_headers, json={
            "name": "TEST_design", "data": {"elements": []}
        })
        assert r.status_code == 200
        did = r.json()["id"]
        r = s.get(f"{API}/designs", headers=user_headers)
        assert r.status_code == 200
        assert any(d["id"] == did for d in r.json())
        r = s.delete(f"{API}/designs/{did}", headers=user_headers)
        assert r.status_code == 200

    def test_designs_unauth(self, s):
        r = s.get(f"{API}/designs")
        assert r.status_code == 401


# ---------- Admin Stats ----------
class TestAdminStats:
    def test_stats(self, s, admin_headers):
        r = s.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ("users", "orders", "paid_orders", "services", "products", "contacts", "revenue"):
            assert k in d
            assert isinstance(d[k], (int, float))

    def test_stats_unauth(self, s, user_headers):
        r = s.get(f"{API}/admin/stats", headers=user_headers)
        assert r.status_code == 403


# ---------- Templates / Learning admin CRUD quick smoke ----------
class TestAdminMisc:
    def test_template_create_delete(self, s, admin_headers):
        r = s.post(f"{API}/templates", headers=admin_headers, json={
            "name": "TEST_Tmpl", "category": "test", "data": {}
        })
        assert r.status_code == 200
        tid = r.json()["id"]
        r = s.delete(f"{API}/templates/{tid}", headers=admin_headers)
        assert r.status_code == 200

    def test_learning_create_delete(self, s, admin_headers):
        r = s.post(f"{API}/learning", headers=admin_headers, json={
            "title": "TEST_Learn", "type": "pdf", "price": 0, "is_free": True
        })
        assert r.status_code == 200
        lid = r.json()["id"]
        r = s.delete(f"{API}/learning/{lid}", headers=admin_headers)
        assert r.status_code == 200

    def test_coupon_create_delete(self, s, admin_headers):
        r = s.post(f"{API}/coupons", headers=admin_headers, json={
            "code": f"test{uuid.uuid4().hex[:4]}", "percent": 5, "active": True
        })
        assert r.status_code == 200
        cid = r.json()["id"]
        r = s.delete(f"{API}/coupons/{cid}", headers=admin_headers)
        assert r.status_code == 200

    def test_testimonial_admin(self, s, admin_headers):
        r = s.post(f"{API}/testimonials", headers=admin_headers, json={
            "name": "TEST_T", "location": "X", "text": "ok"
        })
        assert r.status_code == 200
        tid = r.json()["id"]
        r = s.delete(f"{API}/testimonials/{tid}", headers=admin_headers)
        assert r.status_code == 200

    def test_gallery_admin(self, s, admin_headers):
        r = s.post(f"{API}/gallery", headers=admin_headers, json={
            "title": "TEST_G", "image": "https://x.com/a.jpg"
        })
        assert r.status_code == 200
        gid = r.json()["id"]
        r = s.delete(f"{API}/gallery/{gid}", headers=admin_headers)
        assert r.status_code == 200


# ---------- NEW: File Upload ----------
class TestUpload:
    def test_upload_admin(self, s, admin_headers):
        # tiny 1x1 PNG
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
            "89000000014944415478da6300000000050001ff26dd2a0000000049454e44ae426082"
        )
        files = {"file": ("test.png", png, "image/png")}
        r = s.post(f"{API}/upload", headers=admin_headers, files=files)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and d["url"].startswith("/api/uploads/")
        assert "filename" in d and d["filename"].endswith(".png")
        assert d["size"] == len(png)
        # Verify accessible via static mount
        g = s.get(f"{BASE_URL}{d['url']}")
        assert g.status_code == 200
        assert len(g.content) == d["size"]

    def test_upload_non_admin_403(self, s, user_headers):
        files = {"file": ("test.png", b"\x89PNG\r\n\x1a\n", "image/png")}
        r = s.post(f"{API}/upload", headers=user_headers, files=files)
        assert r.status_code == 403

    def test_upload_bad_ext(self, s, admin_headers):
        files = {"file": ("evil.exe", b"MZ", "application/octet-stream")}
        r = s.post(f"{API}/upload", headers=admin_headers, files=files)
        assert r.status_code == 400


# ---------- NEW: Homepage settings ----------
class TestHomepageSettings:
    def test_get_default(self, s):
        r = s.get(f"{API}/settings/homepage")
        assert r.status_code == 200
        d = r.json()
        for k in ("hero_title_line1", "hero_title_line2", "hero_title_line3",
                  "hero_subtitle", "about_heading", "about_para1", "about_para2",
                  "stat_clients", "stat_orders", "stat_years", "phone",
                  "whatsapp", "email", "address", "hours"):
            assert k in d

    def test_put_requires_admin(self, s, user_headers):
        r = s.put(f"{API}/settings/homepage", headers=user_headers, json={
            "hero_title_line1": "x", "hero_title_line2": "y", "hero_title_line3": "z",
            "hero_subtitle": "s", "about_heading": "a", "about_para1": "p",
            "about_para2": "p2", "stat_clients": 1, "stat_orders": 2, "stat_years": 3,
            "phone": "+1", "whatsapp": "+1", "email": "e@e.com",
            "address": "x", "hours": "9-5"
        })
        assert r.status_code == 403

    def test_put_and_persist(self, s, admin_headers):
        # snapshot current
        orig = s.get(f"{API}/settings/homepage").json()
        payload = dict(orig)
        new_line1 = f"TEST_{uuid.uuid4().hex[:6]}"
        payload["hero_title_line1"] = new_line1
        payload["stat_clients"] = 777
        r = s.put(f"{API}/settings/homepage", headers=admin_headers, json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["hero_title_line1"] == new_line1
        # verify persistence
        g = s.get(f"{API}/settings/homepage").json()
        assert g["hero_title_line1"] == new_line1
        assert g["stat_clients"] == 777
        # restore
        s.put(f"{API}/settings/homepage", headers=admin_headers, json=orig)


# ---------- NEW: User Profile update ----------
class TestProfile:
    def test_update_name_phone(self, s):
        email = f"profile_{uuid.uuid4().hex[:6]}@x.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "Orig", "email": email, "password": "Test@1234", "phone": "+910000000000"
        })
        assert r.status_code == 200
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        r = s.put(f"{API}/auth/me", headers=h, json={"name": "New Name", "phone": "+911111111111"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "New Name"
        assert d["phone"] == "+911111111111"
        # verify via GET
        me = s.get(f"{API}/auth/me", headers=h).json()
        assert me["name"] == "New Name"
        assert me["phone"] == "+911111111111"

    def test_new_password_requires_current(self, s):
        email = f"pwd_{uuid.uuid4().hex[:6]}@x.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "U", "email": email, "password": "Test@1234"
        })
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        r = s.put(f"{API}/auth/me", headers=h, json={"new_password": "newpass1"})
        assert r.status_code == 400

    def test_new_password_min_length(self, s):
        email = f"pwd2_{uuid.uuid4().hex[:6]}@x.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "U", "email": email, "password": "Test@1234"
        })
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        r = s.put(f"{API}/auth/me", headers=h, json={
            "current_password": "Test@1234", "new_password": "abc"
        })
        assert r.status_code == 400

    def test_change_password_success(self, s):
        email = f"pwd3_{uuid.uuid4().hex[:6]}@x.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "U", "email": email, "password": "Test@1234"
        })
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        r = s.put(f"{API}/auth/me", headers=h, json={
            "current_password": "Test@1234", "new_password": "NewPass@1"
        })
        assert r.status_code == 200
        # Login with new password
        lr = s.post(f"{API}/auth/login", json={"email": email, "password": "NewPass@1"})
        assert lr.status_code == 200


# ---------- NEW: Admin User Management ----------
class TestAdminUserMgmt:
    def test_toggle_role_and_delete(self, s, admin_headers):
        email = f"mgr_{uuid.uuid4().hex[:6]}@x.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "U", "email": email, "password": "Test@1234"
        })
        uid = r.json()["user"]["id"]
        # promote
        r = s.put(f"{API}/admin/users/{uid}/role", headers=admin_headers,
                  json={"role": "admin"})
        assert r.status_code == 200
        # verify via admin users list
        users = s.get(f"{API}/admin/users", headers=admin_headers).json()
        assert any(u["id"] == uid and u["role"] == "admin" for u in users)
        # demote
        r = s.put(f"{API}/admin/users/{uid}/role", headers=admin_headers,
                  json={"role": "user"})
        assert r.status_code == 200
        # delete
        r = s.delete(f"{API}/admin/users/{uid}", headers=admin_headers)
        assert r.status_code == 200
        users2 = s.get(f"{API}/admin/users", headers=admin_headers).json()
        assert not any(u["id"] == uid for u in users2)

    def test_cannot_change_own_role(self, s, admin_headers):
        me = s.get(f"{API}/auth/me", headers=admin_headers).json()
        r = s.put(f"{API}/admin/users/{me['id']}/role", headers=admin_headers,
                  json={"role": "user"})
        assert r.status_code == 400

    def test_cannot_delete_self(self, s, admin_headers):
        me = s.get(f"{API}/auth/me", headers=admin_headers).json()
        r = s.delete(f"{API}/admin/users/{me['id']}", headers=admin_headers)
        assert r.status_code == 400

    def test_role_endpoint_non_admin_403(self, s, user_headers):
        r = s.put(f"{API}/admin/users/anyid/role", headers=user_headers,
                  json={"role": "admin"})
        assert r.status_code == 403


# ---------- NEW: Categories ----------
class TestCategories:
    def test_list_categories(self, s):
        r = s.get(f"{API}/categories")
        assert r.status_code == 200
        d = r.json()
        for k in ("services", "products", "gallery", "templates"):
            assert k in d
            assert isinstance(d[k], list)
        # services/products should have at least one seeded category
        assert len(d["services"]) >= 1
        assert len(d["products"]) >= 1


# ---------- NEW: Downloads ----------
class TestDownloads:
    def test_downloads_requires_auth(self, s):
        r = s.get(f"{API}/downloads/me")
        assert r.status_code == 401

    def test_downloads_empty_for_new_user(self, s, user_headers):
        r = s.get(f"{API}/downloads/me", headers=user_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_downloads_after_paid_order(self, s):
        # Register fresh user
        email = f"dl_{uuid.uuid4().hex[:6]}@x.com"
        r = s.post(f"{API}/auth/register", json={
            "name": "DL", "email": email, "password": "Test@1234"
        })
        tok = r.json()["token"]
        h = {"Authorization": f"Bearer {tok}"}
        # Get a real product
        prods = s.get(f"{API}/products").json()
        assert len(prods) >= 1
        p = prods[0]
        items = [{"item_id": p["id"], "item_type": "product",
                  "title": p["title"], "price": p["price"], "qty": 1}]
        r = s.post(f"{API}/orders", headers=h, json={
            "items": items, "customer_name": "DL",
            "customer_email": email, "customer_phone": "+910000000000"
        })
        assert r.status_code == 200
        oid = r.json()["id"]
        po = s.post(f"{API}/payments/create-order", json={
            "amount": p["price"], "order_id": oid
        }).json()
        pay_id = "pay_mock"
        sig = "sig" if po.get("mock") else _sign(po["razorpay_order_id"], pay_id)
        vr = s.post(f"{API}/payments/verify", json={
            "order_id": oid, "razorpay_order_id": po["razorpay_order_id"],
            "razorpay_payment_id": pay_id, "razorpay_signature": sig
        })
        assert vr.status_code == 200, vr.text
        dls = s.get(f"{API}/downloads/me", headers=h).json()
        assert isinstance(dls, list) and len(dls) >= 1
        d0 = dls[0]
        for k in ("order_id", "title", "type", "image", "file_url", "date"):
            assert k in d0
        assert d0["order_id"] == oid
        assert d0["type"] == "product"
        assert d0["title"] == p["title"]
