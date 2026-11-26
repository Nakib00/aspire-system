<?php

namespace Tests\Feature;

use App\Models\Center;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class SuperAdminManagementTest extends TestCase
{
    use LazilyRefreshDatabase;

    private function superAdminToken(): string
    {
        $superAdmin = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => 'password123',
            'role' => 'super_admin',
            'active' => true,
        ]);

        return $this->postJson('/api/v1/login', [
            'email' => $superAdmin->email,
            'password' => 'password123',
        ])->assertOk()->json('token');
    }

    public function test_super_admin_creates_a_center_and_returns_201(): void
    {
        $token = $this->superAdminToken();

        $response = $this->withToken($token)->postJson('/api/v1/centers', [
            'name' => 'Dhaka Learning Center',
            'address' => 'Dhanmondi, Dhaka',
            'capacity' => 150,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Dhaka Learning Center')
            ->assertJsonPath('data.code', 'CTR-001')
            ->assertJsonPath('data.capacity', 150);
        $this->assertDatabaseHas('centers', [
            'name' => 'Dhaka Learning Center',
            'address' => 'Dhanmondi, Dhaka',
            'code' => 'CTR-001',
            'capacity' => 150,
        ]);
    }

    public function test_super_admin_lists_centers_in_alphabetical_order(): void
    {
        Center::create(['name' => 'Zaman Center', 'address' => 'Uttara']);
        Center::create(['name' => 'Aspire Center', 'address' => 'Mirpur']);
        $token = $this->superAdminToken();

        $response = $this->withToken($token)->getJson('/api/v1/centers');

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Aspire Center')
            ->assertJsonPath('data.1.name', 'Zaman Center')
            ->assertJsonPath('total', 2);
    }

    public function test_super_admin_creates_center_admin_with_normalized_email(): void
    {
        $center = Center::create([
            'name' => 'Dhaka Learning Center',
            'address' => 'Dhanmondi, Dhaka',
            'status' => 'active',
        ]);
        $token = $this->superAdminToken();

        $response = $this->withToken($token)->postJson('/api/v1/center-admins', [
            'name' => 'Center Manager',
            'email' => 'MANAGER@EXAMPLE.COM',
            'password' => 'password123',
            'center_id' => $center->id,
            'designation' => 'Principal',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'manager@example.com')
            ->assertJsonPath('data.role', 'center_admin')
            ->assertJsonPath('data.center.id', $center->id);
        $this->assertDatabaseHas('users', [
            'email' => 'manager@example.com',
            'role' => 'center_admin',
            'center_id' => $center->id,
            'active' => true,
        ]);
        $this->assertDatabaseMissing('users', ['email' => 'MANAGER@EXAMPLE.COM']);
    }

    public function test_password_change_revokes_a_center_admins_old_token(): void
    {
        $center = Center::create([
            'name' => 'Dhaka Learning Center',
            'address' => 'Dhanmondi, Dhaka',
            'status' => 'active',
        ]);
        $centerAdmin = User::factory()->create([
            'email' => 'manager@example.com',
            'password' => 'old-password',
            'role' => 'center_admin',
            'active' => true,
            'center_id' => $center->id,
        ]);
        $oldToken = $this->postJson('/api/v1/login', [
            'email' => $centerAdmin->email,
            'password' => 'old-password',
        ])->assertOk()->json('token');
        $token = $this->superAdminToken();

        $response = $this->withToken($token)->patchJson('/api/v1/center-admins/'.$centerAdmin->id, [
            'password' => 'new-password',
        ]);

        $response->assertOk();
        $this->assertSame(1, $centerAdmin->fresh()->token_version);
        $this->withToken($oldToken)->getJson('/api/v1/me')->assertUnauthorized();
        $this->postJson('/api/v1/login', [
            'email' => $centerAdmin->email,
            'password' => 'new-password',
        ])->assertOk();
    }

    public function test_center_admin_endpoint_returns_404_for_a_non_center_admin_user(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
            'active' => true,
        ]);
        $token = $this->superAdminToken();

        $response = $this->withToken($token)->getJson('/api/v1/center-admins/'.$teacher->id);

        $response->assertNotFound();
    }
}
