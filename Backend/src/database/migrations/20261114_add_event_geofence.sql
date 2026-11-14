-- Location-based attendance check-in.
--
-- An event may carry a geofence: a centre point (latitude/longitude) and a
-- radius in metres. When all three are set, a member can only record
-- attendance for that event from within the radius; the distance is checked
-- server-side against the coordinates the member's device reports. Events
-- with any of the three left NULL have no geofence and check in from anywhere,
-- so existing events keep working unchanged.
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS geofence_radius_m INTEGER;

ALTER TABLE events
    ADD CONSTRAINT chk_events_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT chk_events_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    ADD CONSTRAINT chk_events_geofence_radius CHECK (geofence_radius_m IS NULL OR geofence_radius_m > 0);
