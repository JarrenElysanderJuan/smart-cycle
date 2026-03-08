import math

def calculate_routing_distance(lat1, lon1, lat2, lon2):
    
    # this implementation uses Haversine's formula
    # which is an ideal formula for calculating the
    # distance between two points on the globe
    
    # earth's radius in km
    r = 6371.0
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    # square half of the chord length 
    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0)**2
        
    # angular distance
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    # final distance
    haversine_km = r * c

    # multiply by 1.3 to account for roads
    # not being direct
    return haversine_km * 1.3

def get_travel_time_mins(distance_km):

    # assumes an average speed of 40.0 km/s
    # returns time in minutes
    return (distance_km / 40.0) * 60.0

def generate_ranking(payload):

    # info needed for ranking
    alert = payload.get("alert", {})
    origin = alert.get("origin_data", {})
    food_banks = payload.get("food_banks", [])
    
    alert_weight = alert.get("estimated_weight_kg", 0)
    store_lat = origin.get("latitude", 0)
    store_lon = origin.get("longitude", 0)
    
    # array of potential food banks
    valid_candidates = []
    
    # scans all food banks
    for bank in food_banks:

        # check if food bank has open space
        available_cap = bank.get("capacity_kg", 0) - bank.get("current_inventory_kg", 0)
        if available_cap < alert_weight:
            continue
            
        bank_lat = bank.get("latitude", 0)
        bank_lon = bank.get("longitude", 0)

        # calculate distance
        dist_km = calculate_routing_distance(store_lat, store_lon, bank_lat, bank_lon)
        
        # check if bank can pickup
        can_pickup = bank.get("pickup_capability", False)
        if can_pickup:
            if dist_km > bank.get("max_pickup_distance_km", 0):
                continue
        else:
            if dist_km > bank.get("service_area_radius_km", 0):
                continue
                
        priority = bank.get("priority_score", 0.0)
        demand = bank.get("avg_weekly_demand_kg", 0)
        
        # formula for calculating rank, priority first, accounts
        # and subtracts for distance
        score = (priority * 100) + (demand * 0.05) - (dist_km * 2)
        
        valid_candidates.append({
            "bank": bank,
            "score": score,
            "dist_km": dist_km,
            "can_pickup": can_pickup
        })
        
    # sort valid food banks
    valid_candidates.sort(key=lambda item: item["score"], reverse=True)
    
    # add results to a json payload
    results = []
    for index, item in enumerate(valid_candidates):
        bank = item["bank"]
        reason = f"Distance: {item['dist_km']:.1f}km, Priority: {bank.get('priority_score')}, Pickup: {item['can_pickup']}"
        results.append({
            "food_bank_id": bank.get("id"),
            "rank": index + 1,
            "match_reason": reason
        })
        
    # return results
    return results