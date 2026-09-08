import urllib.request
import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def test_live_api():
    print("Testing Live HTTP Endpoints on http://localhost:3000...")

    # 1. Test Demo Login
    payload = json.dumps({"role": "manager"}).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:3000/api/auth/demo-login",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode("utf-8"))
        token = data["token"]
        user = data["user"]
        print(f"✅ Demo Login successful: {user['name']} ({user['role']}, {user['title']})")

    # 2. Test Projects endpoint with Bearer Token
    req_projects = urllib.request.Request(
        "http://localhost:3000/api/projects",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_projects) as res:
        assert res.status == 200
        proj_data = json.loads(res.read().decode("utf-8"))
        projects = proj_data["projects"]
        print(f"✅ Projects fetched: {len(projects)} active projects")
        for p in projects:
            stats = p["taskStats"]
            print(f"   - [{p['key']}] {p['name']}: {stats['done']}/{stats['total']} tasks ({stats['progressPercentage']}%)")

    # 3. Test Tasks endpoint
    req_tasks = urllib.request.Request(
        "http://localhost:3000/api/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_tasks) as res:
        assert res.status == 200
        tasks_data = json.loads(res.read().decode("utf-8"))
        tasks = tasks_data["tasks"]
        print(f"✅ Tasks fetched: {len(tasks)} tasks found across all projects")

    # 4. Test Analytics endpoint
    req_analytics = urllib.request.Request(
        "http://localhost:3000/api/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_analytics) as res:
        assert res.status == 200
        ana_data = json.loads(res.read().decode("utf-8"))
        metrics = ana_data["metrics"]
        print(f"✅ Analytics fetched: {metrics['completionRate']}% velocity, {metrics['totalTasks']} total tasks")

    print("\n🎉 ALL LIVE HTTP ENDPOINTS RESPONDED WITH HTTP 200 OK!\n")

if __name__ == "__main__":
    test_live_api()
