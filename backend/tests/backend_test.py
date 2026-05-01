"""GurucraftPro backend pytest suite."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://craftpro-services.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@gurucraftpro.in"
ADMIN_PASSWORD = "Gurucraftpro"


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

        # payment create-order (mock)
        r = s.post(f"{API}/payments/create-order", json={"amount": 1800, "order_id": oid})
        assert r.status_code == 200
        pd = r.json()
        assert pd["mock"] is True
        assert pd["razorpay_order_id"].startswith("order_mock_")

        # verify
        r = s.post(f"{API}/payments/verify", json={
            "order_id": oid, "razorpay_order_id": pd["razorpay_order_id"],
            "razorpay_payment_id": "pay_mock_xyz", "razorpay_signature": "mock_sig"
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
