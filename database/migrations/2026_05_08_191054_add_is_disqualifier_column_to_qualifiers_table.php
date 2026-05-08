<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('category_qualifiers', function (Blueprint $table) {
            $table->boolean('is_disqualifier')->default(false)->after('display_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('category_qualifiers', function (Blueprint $table) {
            $table->dropColumn('is_disqualifier');
        });
    }
};
