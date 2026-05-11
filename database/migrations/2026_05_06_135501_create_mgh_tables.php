<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates ALL application tables matching the CSV data structure.
     */
    public function up(): void
    {
        // ─── Reference/Lookup Tables ─────────────────────────────────────────────

        Schema::create('mgh_cities', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. "marrakech", "essaouira"
            $table->json('label');           // { en, es, fr }
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('mgh_property_types', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. "riad", "kasbah", "guesthouse"
            $table->json('label');           // { en, es, fr }
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('mgh_neighborhoods', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. "mouassine", "kasbah"
            $table->json('label');           // { en, es, fr }
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('mgh_amenities_catalog', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. "wifi", "pool"
            $table->json('label');           // { en, es, fr }
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('mgh_services_catalog', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. "breakfast", "airport_transfer"
            $table->json('label');           // { en, es, fr }
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('mgh_booking_conditions_catalog', function (Blueprint $table) {
            $table->string('id')->primary(); // e.g. "free_cancel_48h"
            $table->json('label');           // { en, es, fr }
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // ─── Main Properties Table ───────────────────────────────────────────────

        Schema::create('mgh_properties_final', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->json('name');                            // { en, es, fr }
            $table->json('address')->nullable();             // { en, es, fr }
            $table->string('city_id')->nullable();
            $table->string('neighborhood_id')->nullable();
            $table->string('property_type_id')->nullable();
            $table->json('description')->nullable();         // { en, es, fr }
            $table->json('amenity_ids')->nullable();          // array of IDs
            $table->json('service_ids')->nullable();          // array of IDs
            $table->json('booking_condition_ids')->nullable(); // array of IDs
            $table->json('extra_info')->nullable();           // { en, es, fr }
            $table->string('website')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->double('longitude')->nullable();
            $table->double('latitude')->nullable();
            $table->double('rating_avg')->nullable();
            $table->integer('reviews_count')->nullable();
            $table->json('image_urls')->nullable();           // array of URL strings
            $table->text('simple_booking_link')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->index('city_id');
            $table->index('neighborhood_id');
            $table->index('property_type_id');
        });

        // ─── Contacts Table (1:1 with properties) ────────────────────────────────

        Schema::create('mgh_contacts', function (Blueprint $table) {
            $table->id();
            $table->uuid('property_id');         // FK to mgh_properties_final.id
            $table->string('contactname')->nullable();
            $table->string('email')->nullable();
            $table->string('riadname')->nullable();
            $table->string('CM')->nullable();     // Channel Manager
            $table->string('Telephone')->nullable();
            $table->string('membershipstatus')->nullable(); // active, suspended, pending, ex-member
            $table->string('membershiptype')->nullable();
            $table->date('Membersince')->nullable();
            $table->date('renewaldate')->nullable();
            $table->text('mghnotes')->nullable();
            $table->timestamps();

            $table->foreign('property_id')->references('id')->on('mgh_properties_final')->onDelete('cascade');
            $table->index('property_id');
        });

        // ─── Pending Updates (change requests from owners) ───────────────────────

        Schema::create('pending_updates', function (Blueprint $table) {
            $table->id();
            $table->uuid('property_id');
            $table->string('property_name')->nullable();
            $table->string('updated_by_email')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->json('changes')->nullable();          // { field: { old_value, new_value } }
            $table->string('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('property_id')->references('id')->on('mgh_properties_final')->onDelete('cascade');
            $table->index('status');
        });

        // ─── Experiences Table ───────────────────────────────────────────────────

        Schema::create('mgh_experiences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->text('hero_image_url')->nullable();
            $table->json('gallery_urls')->nullable();
            $table->text('map_embed_url')->nullable();
            $table->string('recommended_season')->nullable();
            $table->string('duration_hint')->nullable();
            $table->text('accessibility_notes')->nullable();
            $table->string('approx_budget_hint')->nullable();
            $table->json('related_riads')->nullable();
            $table->boolean('is_published')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('title_tr');
            $table->json('subtitle_tr')->nullable();
            $table->json('destination_tr')->nullable();
            $table->json('short_intro_tr')->nullable();
            $table->json('description_rich_tr')->nullable();
            $table->json('what_to_do_tr')->nullable();
            $table->json('good_to_know_tr')->nullable();
            $table->json('booking_cta_label_tr')->nullable();
            $table->json('seo_title_tr')->nullable();
            $table->json('seo_description_tr')->nullable();
            $table->json('seo_keywords_tr')->nullable();
            $table->timestamps();
        });

        // ─── Destinations Table ──────────────────────────────────────────────────

        Schema::create('mgh_destinations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->json('name');                           // { en, es, fr }
            $table->json('subtitle')->nullable();           // { en, es, fr }
            $table->json('intro_rich')->nullable();         // { en, es, fr }
            $table->json('getting_here')->nullable();       // structured transport data
            $table->json('what_to_do')->nullable();         // structured activities
            $table->json('good_to_know')->nullable();       // tips
            $table->json('when_to_visit')->nullable();      // { en, es, fr }
            $table->json('faq')->nullable();                // structured FAQ
            $table->json('hero_image_urls')->nullable();    // array of URLs
            $table->json('best_months')->nullable();        // array of month numbers
            $table->json('gallery_urls')->nullable();       // array of URLs
            $table->text('map_embed_url')->nullable();
            $table->json('related_experiences')->nullable();
            $table->json('related_collections')->nullable();
            $table->json('cta_label')->nullable();          // { en, es, fr }
            $table->text('cta_url')->nullable();
            $table->json('seo_title')->nullable();          // { en, es, fr }
            $table->json('seo_description')->nullable();    // { en, es, fr }
            $table->json('seo_keywords')->nullable();       // { en, es, fr }
            $table->boolean('is_published')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // ─── Why Book Direct Table ───────────────────────────────────────────────

        Schema::create('why_book_direct', function (Blueprint $table) {
            $table->id();
            $table->string('title_key');
            $table->string('description_key');
            $table->string('icon_name');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // ─── AMH Quartiers (Medina Neighborhoods Guide) ──────────────────────────

        Schema::create('amh_quartiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->json('name_tr');                          // { en, es, fr }
            $table->json('short_desc_tr')->nullable();        // { en, es, fr }
            $table->json('long_desc_tr')->nullable();         // { en, es, fr }
            $table->integer('walking_minutes_from_jemaa')->nullable();
            $table->json('todo_see_tr')->nullable();          // structured items per lang
            $table->json('images')->nullable();               // array of URLs
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->json('category_tags')->nullable();        // array of strings
            $table->json('ambiance_tags')->nullable();        // array of strings
            $table->integer('display_order')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->json('seo_title_tr')->nullable();         // { en, es, fr }
            $table->json('seo_desc_tr')->nullable();          // { en, es, fr }
            $table->text('cta_url')->nullable();
            $table->timestamps();
        });

        // ─── AMH Points of Interest ─────────────────────────────────────────────

        Schema::create('amh_pois', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('quartier_id')->nullable();
            $table->string('slug');
            $table->string('type')->nullable();              // monument, other, etc.
            $table->json('name_tr');                          // { en, fr }
            $table->json('short_desc_tr')->nullable();        // { en, fr }
            $table->json('long_desc_tr')->nullable();         // { en, fr }
            $table->string('address')->nullable();
            $table->json('hours')->nullable();                // { en, fr }
            $table->json('price')->nullable();                // { en, fr }
            $table->string('website')->nullable();
            $table->double('lat')->nullable();
            $table->double('lng')->nullable();
            $table->json('images')->nullable();               // array of URLs
            $table->integer('display_order')->default(0);
            $table->timestamps();

            $table->foreign('quartier_id')->references('id')->on('amh_quartiers')->nullOnDelete();
            $table->index('quartier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('amh_pois');
        Schema::dropIfExists('amh_quartiers');
        Schema::dropIfExists('why_book_direct');
        Schema::dropIfExists('mgh_destinations');
        Schema::dropIfExists('mgh_experiences');
        Schema::dropIfExists('pending_updates');
        Schema::dropIfExists('mgh_contacts');
        Schema::dropIfExists('mgh_properties_final');
        Schema::dropIfExists('mgh_booking_conditions_catalog');
        Schema::dropIfExists('mgh_services_catalog');
        Schema::dropIfExists('mgh_amenities_catalog');
        Schema::dropIfExists('mgh_neighborhoods');
        Schema::dropIfExists('mgh_property_types');
        Schema::dropIfExists('mgh_cities');
    }
};
