import pandas as pd
from shapely.geometry import Point, MultiPoint
from shapely.geometry.polygon import Polygon

# Read the CSV file containing the coordinates
csv_file = 'random_coordinates_within_100_miles_of_tamu.csv'
df = pd.read_csv(csv_file)

# Convert the DataFrame to a list of (lat, lon) tuples
coordinates = [(row['Latitude'], row['Longitude']) for index, row in df.iterrows()]

# Create a convex hull from the coordinates
def create_convex_hull(coords):
    points = MultiPoint([Point(coord[1], coord[0]) for coord in coords])
    hull = points.convex_hull
    return hull

# Filter out points that are within the convex hull
def filter_points_outside_hull(coords, hull):
    return [coord for coord in coords if not Point(coord[1], coord[0]).within(hull)]

# Create the convex hull
convex_hull_polygon = create_convex_hull(coordinates)

# Get points that are outside the convex hull
points_outside_hull = filter_points_outside_hull(coordinates, convex_hull_polygon)

# Output the results
print("Coordinates within the largest geofence (convex hull) are ignored.")
print("Remaining coordinates outside the largest geofence:")
for point in points_outside_hull:
    print(point)
