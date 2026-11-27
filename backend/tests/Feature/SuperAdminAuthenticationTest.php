<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class SuperAdminAuthenticationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_valid_credentials_return_a_bearer_token_and_super_admin_details(): void
    {
        $this->travelTo('2026-11-27 10:00:00');
        $superAdmin = User::factory()->create([
            'name' => 'Aspire Owner',
            'email' => 'owner@example.com',
            'password' => 'password123',
            'role' => 'super_admin',
            'active' => true,
            'center_id' => null,
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'OWNER@EXAMPLE.COM',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('user.id', $superAdmin->id)
            ->assertJsonPath('user.role', 'super_admin')
            ->assertJsonPath('user.center_id', null)
            ->assertJsonStructure(['token', 'expires_in', 'user']);
        $this->assertCount(3, explode('.', $response->json('token')));
        $this->assertDatabaseHas('users', [
            'id' => $superAdmin->id,
            'last_login_at' => '2026-11-27 10:00:00',
        ]);
    }

    public function test_missing_login_fields_return_422_with_validation_errors(): void
    {
        $response = $this->postJson('/api/v1/login', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_wrong_password_returns_401_without_updating_last_login_time(): void
    {
        $superAdmin = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => 'password123',
            'role' => 'super_admin',
            'active' => true,
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => $superAdmin->email,
            'password' => 'wrong-password',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid credentials or inactive account.');
        $this->assertNull($superAdmin->fresh()->last_login_at);
    }
}
