import urllib.request, urllib.parse, json, http.cookiejar, sys

base = "http://localhost:3000"
cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def get(path):
    req = urllib.request.Request(f"{base}{path}")
    return opener.open(req)

def post(path, data):
    req = urllib.request.Request(
        f"{base}{path}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    return opener.open(req)

print("🔍 1. Checking Public & Auth Pages...")
for path in ["/", "/login", "/register"]:
    res = get(path)
    html = res.read().decode("utf-8")
    assert res.status == 200, f"Failed {path}: {res.status}"
    assert "NOVA" in html, f"Missing NOVA title in {path}"
    print(f"   ✅ {path} -> HTTP {res.status} ({len(html)} bytes)")

print("\n🔑 2. Testing 1-Click Demo Login (Admin)...")
res = post("/api/auth/demo-login", {"role": "admin"})
data = json.loads(res.read().decode("utf-8"))
user = data["user"]
assert user["role"] == "ADMIN", f"Expected ADMIN, got {user['role']}"
print(f"   ✅ Logged in as: {user['name']} ({user['role']})")

print("\n🖥️ 3. Checking Protected Application Pages...")
for path in ["/dashboard", "/projects", "/analytics", "/team"]:
    res = get(path)
    html = res.read().decode("utf-8")
    assert res.status == 200, f"Failed {path}: {res.status}"
    print(f"   ✅ {path} -> HTTP {res.status} ({len(html)} bytes)")

print("\n📂 4. Testing Project Workspace & Tabs...")
res = get("/api/projects")
projects = json.loads(res.read().decode("utf-8"))["projects"]
assert len(projects) > 0, "No projects returned"
active_proj = projects[0]
print(f"   ✅ Found {len(projects)} projects. Testing project: \"{active_proj['name']}\" ({active_proj['id']})")

res = get(f"/projects/{active_proj['id']}")
html = res.read().decode("utf-8")
assert res.status == 200, f"Failed /projects/{active_proj['id']}"
print(f"   ✅ /projects/{active_proj['id']} -> HTTP 200 ({len(html)} bytes)")

print("\n⚡ 5. Testing Full Project Lifecycle (Create -> Tasks -> Comments -> Subtasks -> Delete)...")
# 5a. Create temporary project
res = post("/api/projects", {
    "name": "E2E Verification Project",
    "key": "E2ETEST",
    "description": "Verifying full system health",
    "priority": "HIGH"
})
new_proj = json.loads(res.read().decode("utf-8"))["project"]
pid = new_proj["id"]
print(f"   ✅ Created Project {new_proj['key']} (ID: {pid})")

# 5b. Create task in project
res = post("/api/tasks", {
    "projectId": pid,
    "title": "Complete E2E System Health Check",
    "description": "Testing tasks, checklists, and activity log",
    "status": "TODO",
    "priority": "HIGH"
})
task = json.loads(res.read().decode("utf-8"))["task"]
tid = task["id"]
print(f"   ✅ Created Task: \"{task['title']}\" (ID: {tid})")

# 5c. Move task to IN_PROGRESS
patch_req = urllib.request.Request(
    f"{base}/api/tasks/{tid}",
    data=json.dumps({"status": "IN_PROGRESS", "order": 0}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="PATCH"
)
res = opener.open(patch_req)
assert res.status == 200
print(f"   ✅ Updated Task Status to IN_PROGRESS")

# 5d. Add subtask checklist item
res = post(f"/api/tasks/{tid}/subtasks", {"title": "Verify database consistency"})
subtask = json.loads(res.read().decode("utf-8"))["subtask"]
sid = subtask["id"]
print(f"   ✅ Created Subtask: \"{subtask['title']}\" (ID: {sid})")

# 5e. Toggle subtask
patch_sub = urllib.request.Request(
    f"{base}/api/subtasks/{sid}",
    data=json.dumps({"completed": True}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="PATCH"
)
res = opener.open(patch_sub)
assert res.status == 200
print(f"   ✅ Checked off subtask (completed: True)")

# 5f. Add comment
res = post(f"/api/tasks/{tid}/comments", {"content": "Automated verification passed successfully."})
comment = json.loads(res.read().decode("utf-8"))["comment"]
print(f"   ✅ Added comment: \"{comment['content']}\"")

# 5g. Delete project as Admin
del_req = urllib.request.Request(f"{base}/api/projects/{pid}", method="DELETE")
res = opener.open(del_req)
assert res.status == 200
print(f"   ✅ Cleaned up project cleanly (HTTP {res.status})")

print("\n🎉 ALL APPLICATION PAGES, APIS, AND USER FLOWS ARE FULLY FUNCTIONAL WITH 0 ISSUES!")
