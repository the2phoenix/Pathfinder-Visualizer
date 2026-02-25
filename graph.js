// ============================================================
// graph.js — Weighted Undirected Graph + 100-Node City Map
// ============================================================

export class Graph {
    constructor() {
        this.nodes = new Map();   // id → { x, y, label, type }
        this.edges = new Map();   // id → [{ node, weight }]
    }

    addNode(id, x, y, label, type = 'default') {
        this.nodes.set(id, { id, x, y, label, type });
        if (!this.edges.has(id)) this.edges.set(id, []);
    }

    addEdge(fromId, toId, weight = null) {
        const a = this.nodes.get(fromId);
        const b = this.nodes.get(toId);
        if (!a || !b) throw new Error(`Node not found: ${fromId} or ${toId}`);

        if (weight === null) {
            weight = Math.hypot(b.x - a.x, b.y - a.y);
        }
        weight = Math.round(weight);

        this.edges.get(fromId).push({ node: toId, weight });
        this.edges.get(toId).push({ node: fromId, weight });
    }

    getNeighbors(id) {
        return this.edges.get(id) || [];
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }

    getAllEdges() {
        const seen = new Set();
        const result = [];
        for (const [fromId, neighbors] of this.edges) {
            for (const { node: toId, weight } of neighbors) {
                const key = [fromId, toId].sort().join('-');
                if (!seen.has(key)) {
                    seen.add(key);
                    result.push({ from: fromId, to: toId, weight });
                }
            }
        }
        return result;
    }

    heuristic(a, b) {
        const nodeA = this.nodes.get(a);
        const nodeB = this.nodes.get(b);
        return Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
    }
}

// ============================================================
// Factory: Create a 100-node city map
// ============================================================
export function createCityMap() {
    const g = new Graph();

    // ==========================================
    //  HOME (default start)
    // ==========================================
    g.addNode('home', 1200, 800, 'My Home', 'home');

    // ==========================================
    //  CENTRAL DISTRICT (around City Hall)
    // ==========================================
    g.addNode('city_hall', 1150, 700, 'City Hall', 'government');
    g.addNode('central_park', 1050, 620, 'Central Park', 'park');
    g.addNode('main_square', 1300, 650, 'Main Square', 'landmark');
    g.addNode('post_office', 1250, 750, 'Post Office', 'government');
    g.addNode('central_bank', 1100, 780, 'Central Bank', 'business');
    g.addNode('restaurant_row', 1200, 900, 'Restaurant Row', 'shopping');
    g.addNode('coffee_house', 1320, 820, 'The Coffee House', 'shopping');
    g.addNode('book_store', 1050, 850, 'City Book Store', 'shopping');
    g.addNode('fountain_plaza', 1180, 640, 'Fountain Plaza', 'landmark');
    g.addNode('clock_tower', 1350, 730, 'Clock Tower', 'landmark');

    // ==========================================
    //  NORTH DISTRICT
    // ==========================================
    g.addNode('north_station', 1100, 350, 'North Station', 'station');
    g.addNode('university', 900, 300, 'University', 'education');
    g.addNode('tech_park', 1350, 280, 'Tech Park', 'business');
    g.addNode('library', 1000, 430, 'Public Library', 'education');
    g.addNode('science_museum', 1150, 250, 'Science Museum', 'landmark');
    g.addNode('north_park', 850, 400, 'Maple Park', 'park');
    g.addNode('yoga_studio', 1250, 380, 'Yoga Studio', 'entertainment');
    g.addNode('art_gallery', 1050, 500, 'Art Gallery', 'entertainment');
    g.addNode('organic_market', 950, 520, 'Organic Market', 'shopping');
    g.addNode('daycare', 1200, 450, 'Sunshine Daycare', 'education');

    // ==========================================
    //  NORTHEAST DISTRICT
    // ==========================================
    g.addNode('tech_hub', 1550, 250, 'Innovation Hub', 'business');
    g.addNode('startup_campus', 1650, 350, 'Startup Campus', 'business');
    g.addNode('data_center', 1500, 400, 'Data Center', 'business');
    g.addNode('ne_cafe', 1600, 180, 'Hilltop Café', 'shopping');
    g.addNode('observatory', 1450, 150, 'Observatory', 'education');
    g.addNode('drone_park', 1700, 250, 'Drone Park', 'park');

    // ==========================================
    //  EAST DISTRICT
    // ==========================================
    g.addNode('east_mall', 1700, 550, 'East Mall', 'shopping');
    g.addNode('hospital', 1800, 700, 'General Hospital', 'hospital');
    g.addNode('sports_arena', 1650, 750, 'Sports Arena', 'entertainment');
    g.addNode('east_park', 1900, 500, 'Riverside Park', 'park');
    g.addNode('pharmacy', 1750, 630, 'City Pharmacy', 'hospital');
    g.addNode('gym', 1550, 650, 'Iron Gym', 'entertainment');
    g.addNode('pet_clinic', 1850, 600, 'Pet Clinic', 'hospital');
    g.addNode('bowling', 1600, 500, 'Strike Bowling', 'entertainment');
    g.addNode('sushi_bar', 1500, 580, 'Sushi Paradise', 'shopping');
    g.addNode('east_school', 1700, 450, 'Eastside School', 'education');

    // ==========================================
    //  SOUTHEAST DISTRICT
    // ==========================================
    g.addNode('airport', 1900, 950, 'Airport', 'transport');
    g.addNode('cargo_depot', 1800, 1050, 'Cargo Depot', 'transport');
    g.addNode('hotel_grand', 1700, 900, 'Grand Hotel', 'residential');
    g.addNode('convention_ctr', 1600, 950, 'Convention Center', 'business');
    g.addNode('se_park', 1850, 850, 'Palm Garden', 'park');
    g.addNode('driving_school', 1750, 1000, 'Driving School', 'education');
    g.addNode('car_wash', 1650, 1050, 'Sparkle Car Wash', 'business');
    g.addNode('gas_station_e', 1550, 870, 'East Gas Station', 'business');

    // ==========================================
    //  SOUTH DISTRICT
    // ==========================================
    g.addNode('south_station', 1100, 1150, 'South Station', 'station');
    g.addNode('market', 1300, 1050, 'Old Market', 'shopping');
    g.addNode('museum', 950, 1000, 'City Museum', 'landmark');
    g.addNode('school', 850, 1100, 'Lincoln School', 'education');
    g.addNode('harbor', 1200, 1300, 'Harbor', 'transport');
    g.addNode('fish_market', 1300, 1250, 'Fish Market', 'shopping');
    g.addNode('lighthouse', 1100, 1400, 'Lighthouse', 'landmark');
    g.addNode('beach', 1350, 1350, 'Sunset Beach', 'park');
    g.addNode('surf_shop', 1250, 1400, 'Surf Shop', 'shopping');
    g.addNode('aquarium', 1050, 1250, 'City Aquarium', 'entertainment');
    g.addNode('south_clinic', 1150, 1050, 'South Clinic', 'hospital');
    g.addNode('bakery', 1000, 1100, 'Golden Bakery', 'shopping');

    // ==========================================
    //  SOUTHWEST DISTRICT
    // ==========================================
    g.addNode('power_plant', 500, 1100, 'Power Plant', 'business');
    g.addNode('recycling', 600, 1200, 'Recycling Center', 'business');
    g.addNode('sw_park', 700, 1050, 'Willow Park', 'park');
    g.addNode('community_hall', 650, 950, 'Community Hall', 'government');
    g.addNode('sw_school', 550, 1000, 'Riverside School', 'education');
    g.addNode('laundromat', 750, 1150, 'Quick Wash', 'business');

    // ==========================================
    //  WEST DISTRICT
    // ==========================================
    g.addNode('west_gate', 500, 650, 'West Gate', 'landmark');
    g.addNode('factory', 400, 500, 'Industrial Zone', 'business');
    g.addNode('residential_w', 550, 850, 'West Residential', 'residential');
    g.addNode('fire_station', 700, 700, 'Fire Station', 'emergency');
    g.addNode('west_park', 400, 850, 'Sunset Park', 'park');
    g.addNode('police_hq', 600, 750, 'Police HQ', 'emergency');
    g.addNode('cinema', 800, 720, 'Grand Cinema', 'entertainment');
    g.addNode('pizza_place', 700, 830, 'Tony\'s Pizza', 'shopping');
    g.addNode('tailor', 500, 750, 'Master Tailor', 'shopping');
    g.addNode('gas_station_w', 450, 600, 'West Gas Station', 'business');
    g.addNode('auto_repair', 350, 700, 'Auto Repair Shop', 'business');

    // ==========================================
    //  NORTHWEST DISTRICT
    // ==========================================
    g.addNode('temple', 600, 350, 'Heritage Temple', 'landmark');
    g.addNode('monastery', 500, 250, 'Old Monastery', 'landmark');
    g.addNode('nw_garden', 700, 300, 'Zen Garden', 'park');
    g.addNode('pottery_studio', 650, 450, 'Pottery Studio', 'entertainment');
    g.addNode('herb_shop', 550, 400, 'Herbal Shop', 'shopping');
    g.addNode('waterfall', 450, 300, 'Silver Waterfall', 'park');
    g.addNode('camping_ground', 350, 350, 'Camping Ground', 'park');
    g.addNode('archery_range', 400, 450, 'Archery Range', 'entertainment');
    g.addNode('nw_station', 700, 200, 'Northwest Station', 'station');

    // ==========================================
    //  EXTRA LANDMARKS (filling to 100)
    // ==========================================
    g.addNode('stadium', 1400, 1100, 'City Stadium', 'entertainment');
    g.addNode('courthouse', 1000, 700, 'Courthouse', 'government');
    g.addNode('tv_station', 1500, 750, 'TV Station', 'business');
    g.addNode('radio_tower', 1450, 500, 'Radio Tower', 'business');
    g.addNode('zoo', 850, 550, 'City Zoo', 'entertainment');
    g.addNode('botanical_garden', 750, 480, 'Botanical Garden', 'park');

    // ==========================================================================
    //  EDGES — Roads connecting all locations (~170 edges)
    // ==========================================================================

    // --- Home connections ---
    g.addEdge('home', 'city_hall');
    g.addEdge('home', 'restaurant_row');
    g.addEdge('home', 'post_office');
    g.addEdge('home', 'central_bank');
    g.addEdge('home', 'coffee_house');

    // --- Central cluster ---
    g.addEdge('city_hall', 'central_park');
    g.addEdge('city_hall', 'main_square');
    g.addEdge('city_hall', 'fountain_plaza');
    g.addEdge('city_hall', 'post_office');
    g.addEdge('city_hall', 'courthouse');
    g.addEdge('central_park', 'fountain_plaza');
    g.addEdge('central_park', 'art_gallery');
    g.addEdge('central_park', 'organic_market');
    g.addEdge('main_square', 'clock_tower');
    g.addEdge('main_square', 'coffee_house');
    g.addEdge('post_office', 'clock_tower');
    g.addEdge('central_bank', 'book_store');
    g.addEdge('central_bank', 'courthouse');
    g.addEdge('restaurant_row', 'book_store');
    g.addEdge('restaurant_row', 'market');
    g.addEdge('coffee_house', 'tv_station');
    g.addEdge('fountain_plaza', 'central_park');

    // --- North cluster ---
    g.addEdge('north_station', 'library');
    g.addEdge('north_station', 'science_museum');
    g.addEdge('north_station', 'daycare');
    g.addEdge('north_station', 'yoga_studio');
    g.addEdge('university', 'library');
    g.addEdge('university', 'north_park');
    g.addEdge('university', 'science_museum');
    g.addEdge('library', 'art_gallery');
    g.addEdge('library', 'organic_market');
    g.addEdge('north_park', 'zoo');
    g.addEdge('north_park', 'botanical_garden');
    g.addEdge('art_gallery', 'fountain_plaza');
    g.addEdge('daycare', 'yoga_studio');
    g.addEdge('tech_park', 'yoga_studio');
    g.addEdge('tech_park', 'science_museum');
    g.addEdge('tech_park', 'tech_hub');
    g.addEdge('organic_market', 'zoo');

    // --- Northeast cluster ---
    g.addEdge('tech_hub', 'startup_campus');
    g.addEdge('tech_hub', 'observatory');
    g.addEdge('tech_hub', 'ne_cafe');
    g.addEdge('startup_campus', 'data_center');
    g.addEdge('startup_campus', 'drone_park');
    g.addEdge('data_center', 'radio_tower');
    g.addEdge('data_center', 'east_school');
    g.addEdge('ne_cafe', 'drone_park');
    g.addEdge('observatory', 'ne_cafe');
    g.addEdge('observatory', 'science_museum');

    // --- East cluster ---
    g.addEdge('east_mall', 'bowling');
    g.addEdge('east_mall', 'east_school');
    g.addEdge('east_mall', 'pharmacy');
    g.addEdge('east_mall', 'east_park');
    g.addEdge('hospital', 'pharmacy');
    g.addEdge('hospital', 'pet_clinic');
    g.addEdge('hospital', 'sports_arena');
    g.addEdge('sports_arena', 'gym');
    g.addEdge('sports_arena', 'hotel_grand');
    g.addEdge('east_park', 'pet_clinic');
    g.addEdge('gym', 'sushi_bar');
    g.addEdge('gym', 'bowling');
    g.addEdge('sushi_bar', 'radio_tower');
    g.addEdge('sushi_bar', 'tv_station');
    g.addEdge('bowling', 'east_school');
    g.addEdge('pharmacy', 'hospital');
    g.addEdge('main_square', 'radio_tower');

    // --- Southeast cluster ---
    g.addEdge('airport', 'se_park');
    g.addEdge('airport', 'cargo_depot');
    g.addEdge('airport', 'hotel_grand');
    g.addEdge('hotel_grand', 'convention_ctr');
    g.addEdge('hotel_grand', 'se_park');
    g.addEdge('convention_ctr', 'gas_station_e');
    g.addEdge('convention_ctr', 'stadium');
    g.addEdge('cargo_depot', 'driving_school');
    g.addEdge('cargo_depot', 'car_wash');
    g.addEdge('driving_school', 'car_wash');
    g.addEdge('gas_station_e', 'tv_station');
    g.addEdge('se_park', 'hospital');

    // --- South cluster ---
    g.addEdge('south_station', 'south_clinic');
    g.addEdge('south_station', 'harbor');
    g.addEdge('south_station', 'bakery');
    g.addEdge('market', 'stadium');
    g.addEdge('market', 'south_clinic');
    g.addEdge('market', 'fish_market');
    g.addEdge('museum', 'school');
    g.addEdge('museum', 'book_store');
    g.addEdge('museum', 'community_hall');
    g.addEdge('school', 'bakery');
    g.addEdge('school', 'sw_park');
    g.addEdge('harbor', 'fish_market');
    g.addEdge('harbor', 'lighthouse');
    g.addEdge('harbor', 'aquarium');
    g.addEdge('fish_market', 'beach');
    g.addEdge('lighthouse', 'surf_shop');
    g.addEdge('lighthouse', 'aquarium');
    g.addEdge('beach', 'surf_shop');
    g.addEdge('south_clinic', 'bakery');
    g.addEdge('restaurant_row', 'south_clinic');

    // --- Southwest cluster ---
    g.addEdge('power_plant', 'sw_school');
    g.addEdge('power_plant', 'recycling');
    g.addEdge('recycling', 'laundromat');
    g.addEdge('sw_park', 'community_hall');
    g.addEdge('sw_park', 'laundromat');
    g.addEdge('community_hall', 'sw_school');
    g.addEdge('community_hall', 'residential_w');
    g.addEdge('sw_school', 'recycling');

    // --- West cluster ---
    g.addEdge('west_gate', 'factory');
    g.addEdge('west_gate', 'fire_station');
    g.addEdge('west_gate', 'gas_station_w');
    g.addEdge('west_gate', 'tailor');
    g.addEdge('fire_station', 'police_hq');
    g.addEdge('fire_station', 'cinema');
    g.addEdge('police_hq', 'tailor');
    g.addEdge('police_hq', 'residential_w');
    g.addEdge('residential_w', 'west_park');
    g.addEdge('residential_w', 'pizza_place');
    g.addEdge('west_park', 'tailor');
    g.addEdge('west_park', 'auto_repair');
    g.addEdge('cinema', 'pizza_place');
    g.addEdge('cinema', 'courthouse');
    g.addEdge('cinema', 'central_park');
    g.addEdge('gas_station_w', 'factory');
    g.addEdge('gas_station_w', 'auto_repair');
    g.addEdge('auto_repair', 'factory');

    // --- Northwest cluster ---
    g.addEdge('temple', 'monastery');
    g.addEdge('temple', 'nw_garden');
    g.addEdge('temple', 'herb_shop');
    g.addEdge('temple', 'pottery_studio');
    g.addEdge('monastery', 'waterfall');
    g.addEdge('monastery', 'camping_ground');
    g.addEdge('nw_garden', 'nw_station');
    g.addEdge('nw_garden', 'botanical_garden');
    g.addEdge('pottery_studio', 'herb_shop');
    g.addEdge('pottery_studio', 'archery_range');
    g.addEdge('waterfall', 'camping_ground');
    g.addEdge('camping_ground', 'archery_range');
    g.addEdge('archery_range', 'factory');
    g.addEdge('nw_station', 'university');
    g.addEdge('nw_station', 'north_park');
    g.addEdge('herb_shop', 'west_gate');

    // --- Cross-district connections ---
    g.addEdge('courthouse', 'fire_station');
    g.addEdge('zoo', 'botanical_garden');
    g.addEdge('botanical_garden', 'pottery_studio');
    g.addEdge('clock_tower', 'radio_tower');
    g.addEdge('tv_station', 'sports_arena');
    g.addEdge('stadium', 'beach');
    g.addEdge('pizza_place', 'book_store');
    g.addEdge('daycare', 'data_center');

    return g;
}
