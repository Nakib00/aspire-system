<?php

namespace Tests\Feature;

use App\Models\Center;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private function login(User $user, string $password = 'password123'): string
    {
        return $this->postJson('/api/v1/login', ['email' => $user->email, 'password' => $password])->assertOk()->json('token');
    }

    public function test_login_logout_and_inactive_users(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $this->postJson('/api/v1/login', ['email' => $admin->email, 'password' => 'incorrect'])->assertUnauthorized();
        $token = $this->login($admin);
        $this->assertCount(3, explode('.', $token));
        $parts = explode('.', $token);
        $this->withToken($parts[0].'.'.$parts[1].'.invalidsignature')->getJson('/api/v1/me')->assertUnauthorized();
        $this->withToken($token)->getJson('/api/v1/me')->assertOk()->assertJsonPath('user.id', $admin->id);
        $this->withToken($token)->postJson('/api/v1/logout')->assertOk();
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
        $admin->update(['active' => false]);
        $this->postJson('/api/v1/login', ['email' => $admin->email, 'password' => 'password123'])->assertUnauthorized();
    }

    public function test_expired_jwt_is_rejected(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $token = $this->login($admin);
        $this->travel(2)->hours();
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_super_admin_can_manage_centers_and_center_admins(): void
    {
        $super = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $token = $this->login($super);
        $center = $this->withToken($token)->postJson('/api/v1/centers', ['name' => 'North', 'address' => 'Dhaka'])->assertCreated()->json('data.id');
        $this->withToken($token)->postJson('/api/v1/centers', ['name' => 'North', 'address' => 'Dhaka'])->assertUnprocessable();
        $other = $this->withToken($token)->postJson('/api/v1/centers', ['name' => 'South', 'address' => 'Dhaka'])->assertCreated()->json('data.id');
        $adminId = $this->withToken($token)->postJson('/api/v1/center-admins', ['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'password123', 'center_id' => $center])->assertCreated()->assertJsonPath('data.role', 'center_admin')->json('data.id');
        $this->assertTrue(Hash::check('password123', User::findOrFail($adminId)->password));
        $this->withToken($token)->patchJson('/api/v1/center-admins/'.$adminId, ['center_id' => $other])->assertOk()->assertJsonPath('data.center_id', $other);
        $this->withToken($token)->getJson('/api/v1/centers/'.$other)->assertOk()->assertJsonPath('data.users.0.id', $adminId);
        $this->withToken($token)->patchJson('/api/v1/centers/'.$other, ['status' => 'inactive'])->assertOk();
        $this->withToken($token)->patchJson('/api/v1/center-admins/'.$adminId, ['center_id' => $other])->assertUnprocessable();
    }

    public function test_center_admin_cannot_access_super_admin_routes_and_deactivation_revokes_token(): void
    {
        $center = Center::create(['name' => 'North', 'address' => 'Dhaka', 'status' => 'active']);
        $super = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $admin = User::factory()->create(['role' => 'center_admin', 'center_id' => $center->id, 'active' => true, 'password' => 'password123']);
        $superToken = $this->login($super);
        $adminToken = $this->login($admin);
        $this->withToken($adminToken)->getJson('/api/v1/centers')->assertForbidden();
        $this->withToken($adminToken)->getJson('/api/v1/center-admins')->assertForbidden();
        $this->withToken($superToken)->patchJson('/api/v1/center-admins/'.$admin->id, ['active' => false])->assertOk();
        $this->assertSame(1, $admin->fresh()->token_version);
        $this->withToken($adminToken)->getJson('/api/v1/me')->assertUnauthorized();
        $this->getJson('/api/v1/centers')->assertUnauthorized();
    }

    public function test_removing_and_reassigning_an_admin_invalidates_old_tokens(): void
    {
        $center = Center::create(['name' => 'North', 'address' => 'Dhaka', 'status' => 'active']);
        $other = Center::create(['name' => 'South', 'address' => 'Dhaka', 'status' => 'active']);
        $super = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $admin = User::factory()->create(['role' => 'center_admin', 'center_id' => $center->id, 'active' => true, 'password' => 'password123']);
        $superToken = $this->login($super);
        $adminToken = $this->login($admin);
        $this->withToken($adminToken)->deleteJson('/api/v1/center-admins/'.$admin->id.'/center')->assertForbidden();
        $this->withToken($superToken)->deleteJson('/api/v1/center-admins/'.$admin->id.'/center')->assertOk()->assertJsonPath('data.center_id', null);
        $this->withToken($adminToken)->getJson('/api/v1/me')->assertUnauthorized();
        $this->postJson('/api/v1/login', ['email' => $admin->email, 'password' => 'password123'])->assertUnauthorized();
        $this->withToken($superToken)->patchJson('/api/v1/center-admins/'.$admin->id, ['center_id' => $other->id])->assertOk()->assertJsonPath('data.center_id', $other->id);
        $this->withToken($adminToken)->getJson('/api/v1/me')->assertUnauthorized();
        $newToken = $this->login($admin);
        $this->withToken($newToken)->getJson('/api/v1/me')->assertOk()->assertJsonPath('user.center_id', $other->id);
    }

    public function test_center_stores_management_details_and_generates_code(): void
    {
        $super = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $token = $this->login($super);
        $payload = ['name' => 'East', 'address' => 'Road 1', 'email' => 'east@example.com', 'contact_person' => 'Rahim', 'contact_phone' => '0170000', 'capacity' => 120, 'established_on' => '2020-01-05', 'opens_at' => '09:00', 'closes_at' => '17:30', 'operating_days' => ['sat', 'sun'], 'notes' => 'Near the park'];
        $this->withToken($token)->postJson('/api/v1/centers', $payload)->assertCreated()
            ->assertJsonPath('data.code', 'CTR-001')->assertJsonPath('data.capacity', 120)->assertJsonPath('data.operating_days', ['sat', 'sun']);
        $this->withToken($token)->postJson('/api/v1/centers', ['name' => 'West', 'address' => 'Road 2', 'opens_at' => '10:00', 'closes_at' => '09:00'])->assertUnprocessable();
        $this->withToken($token)->postJson('/api/v1/centers', ['name' => 'West', 'address' => 'Road 2', 'operating_days' => ['xyz']])->assertUnprocessable();
        $this->withToken($token)->getJson('/api/v1/centers')->assertOk()->assertJsonPath('data.0.admins_count', 0);
    }

    public function test_center_admin_stores_phone_and_designation_and_login_time(): void
    {
        $center = Center::create(['name' => 'North', 'address' => 'Dhaka']);
        $super = User::factory()->create(['role' => 'super_admin', 'active' => true, 'password' => 'password123']);
        $token = $this->login($super);
        $id = $this->withToken($token)->postJson('/api/v1/center-admins', ['name' => 'A', 'email' => 'a@example.com', 'password' => 'password123', 'center_id' => $center->id, 'phone' => '017', 'designation' => 'Principal'])
            ->assertCreated()->assertJsonPath('data.designation', 'Principal')->json('data.id');
        $this->assertNull(User::find($id)->last_login_at);
        $this->login(User::find($id));
        $this->assertNotNull(User::find($id)->last_login_at);
    }
}
