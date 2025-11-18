import requests
import sys
import json
from datetime import datetime, timedelta

class YouniversityAPITester:
    def __init__(self, base_url="https://eduassist-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_user_password = "TestPass123!"
        self.test_user_name = "Test User"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": self.test_user_email,
                "password": self.test_user_password,
                "full_name": self.test_user_name
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.test_user_email,
                "password": self.test_user_password
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        return success and response.get('email') == self.test_user_email

    def test_google_auth_placeholder(self):
        """Test Google auth placeholder"""
        success, response = self.run_test(
            "Google Auth Placeholder",
            "POST",
            "auth/google",
            200,
            data={
                "token": "fake_google_token",
                "email": "google_test@gmail.com",
                "full_name": "Google Test User"
            }
        )
        return success

    def test_byu_netid_placeholder(self):
        """Test BYU NetID placeholder (should return 501)"""
        success, response = self.run_test(
            "BYU NetID Placeholder",
            "POST",
            "auth/byu-netid",
            501,
            data={
                "netid": "test_netid",
                "password": "test_password"
            }
        )
        return success

    def test_create_assignment(self):
        """Test creating a manual assignment"""
        due_date = (datetime.now() + timedelta(days=7)).isoformat()
        success, response = self.run_test(
            "Create Assignment",
            "POST",
            "assignments",
            200,
            data={
                "title": "Test Assignment",
                "description": "This is a test assignment",
                "course_name": "CS 450",
                "due_date": due_date
            }
        )
        if success and 'id' in response:
            self.assignment_id = response['id']
            return True
        return False

    def test_get_assignments(self):
        """Test getting user assignments"""
        success, response = self.run_test("Get Assignments", "GET", "assignments", 200)
        return success and isinstance(response, list)

    def test_toggle_assignment_complete(self):
        """Test toggling assignment completion"""
        if not hasattr(self, 'assignment_id'):
            print("   Skipping - no assignment ID available")
            return False
        
        success, response = self.run_test(
            "Toggle Assignment Complete",
            "PATCH",
            f"assignments/{self.assignment_id}/complete",
            200
        )
        return success and 'completed' in response

    def test_delete_assignment(self):
        """Test deleting an assignment"""
        if not hasattr(self, 'assignment_id'):
            print("   Skipping - no assignment ID available")
            return False
        
        success, response = self.run_test(
            "Delete Assignment",
            "DELETE",
            f"assignments/{self.assignment_id}",
            200
        )
        return success

    def test_lms_config_get(self):
        """Test getting LMS configuration"""
        success, response = self.run_test("Get LMS Config", "GET", "lms/config", 200)
        return success

    def test_lms_config_update(self):
        """Test updating LMS configuration"""
        success, response = self.run_test(
            "Update LMS Config",
            "POST",
            "lms/config",
            200,
            data={
                "learning_suite_api_key": "test_ls_key",
                "canvas_api_key": "test_canvas_key",
                "canvas_domain": "canvas.test.edu"
            }
        )
        return success

    def test_lms_sync_placeholder(self):
        """Test LMS sync placeholder"""
        success, response = self.run_test("LMS Sync Placeholder", "POST", "lms/sync", 200)
        return success

    def test_create_group(self):
        """Test creating a group"""
        success, response = self.run_test(
            "Create Group",
            "POST",
            "groups",
            200,
            data={
                "name": "Test Study Group",
                "description": "A test group for CS 450"
            }
        )
        if success and 'id' in response:
            self.group_id = response['id']
            return True
        return False

    def test_get_groups(self):
        """Test getting user groups"""
        success, response = self.run_test("Get Groups", "GET", "groups", 200)
        return success and isinstance(response, list)

    def test_join_group(self):
        """Test joining a group (should already be member)"""
        if not hasattr(self, 'group_id'):
            print("   Skipping - no group ID available")
            return False
        
        success, response = self.run_test(
            "Join Group",
            "POST",
            f"groups/{self.group_id}/join",
            200
        )
        return success

    def test_send_message(self):
        """Test sending a message to group"""
        if not hasattr(self, 'group_id'):
            print("   Skipping - no group ID available")
            return False
        
        success, response = self.run_test(
            "Send Message",
            "POST",
            f"groups/{self.group_id}/messages",
            200,
            data={
                "content": "Hello, this is a test message!"
            }
        )
        if success and 'id' in response:
            self.message_id = response['id']
            return True
        return False

    def test_get_messages(self):
        """Test getting group messages"""
        if not hasattr(self, 'group_id'):
            print("   Skipping - no group ID available")
            return False
        
        success, response = self.run_test(
            "Get Messages",
            "GET",
            f"groups/{self.group_id}/messages",
            200
        )
        return success and isinstance(response, list)

def main():
    print("🚀 Starting YOUNIVERSITY API Testing...")
    print("=" * 50)
    
    tester = YouniversityAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("User Registration", tester.test_user_registration),
        ("User Login", tester.test_user_login),
        ("Get Current User", tester.test_get_current_user),
        ("Google Auth Placeholder", tester.test_google_auth_placeholder),
        ("BYU NetID Placeholder", tester.test_byu_netid_placeholder),
        ("Create Assignment", tester.test_create_assignment),
        ("Get Assignments", tester.test_get_assignments),
        ("Toggle Assignment Complete", tester.test_toggle_assignment_complete),
        ("Delete Assignment", tester.test_delete_assignment),
        ("Get LMS Config", tester.test_lms_config_get),
        ("Update LMS Config", tester.test_lms_config_update),
        ("LMS Sync Placeholder", tester.test_lms_sync_placeholder),
        ("Create Group", tester.test_create_group),
        ("Get Groups", tester.test_get_groups),
        ("Join Group", tester.test_join_group),
        ("Send Message", tester.test_send_message),
        ("Get Messages", tester.test_get_messages),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {len(failed_tests)}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())