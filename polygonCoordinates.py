import rasterio
import numpy as np
from rasterio import Affine, features
from shapely.geometry import mapping, shape
from shapely.ops import unary_union
from math import floor, ceil, sqrt

from scipy.signal import fftconvolve
def gaussian_blur(in_array, gt, size):
    """Gaussian blur, returns tuple `(ar, gt2)` that have been expanded by `size`"""
    # expand in_array to fit edge of kernel; constant value is zero
    padded_array = np.pad(in_array, size, 'constant')
    # build kernel
    x, y = np.mgrid[-size:size + 1, -size:size + 1]
    g = np.exp(-(x**2 / float(size) + y**2 / float(size)))
    g = (g / g.sum()).astype(in_array.dtype)
    # do the Gaussian blur
    ar = fftconvolve(padded_array, g, mode='full')
    # convolved increased size of array ('full' option); update geotransform
    gt2 = Affine(
        gt.a, gt.b, gt.xoff - (2 * size * gt.a),
        gt.d, gt.e, gt.yoff - (2 * size * gt.e))
    return ar, gt2

vertices = {
    "Sunday": [
        (30.619049, -96.33542075237679),
        (30.62191975847592, -96.33652324152408),
        (30.622175025741555, -96.339394),
        (30.621589556954973, -96.34193455695497),
        (30.619049, -96.34343482973375),
        (30.61777335087583, -96.34066964912417),
        (30.61629283993076, -96.339394),
        (30.616071038237738, -96.33641603823774),
        (30.619049, -96.33542075237679)
    ],
    "Monday": [
        (30.619049, -96.33613285869609),
        (30.621901712626677, -96.33846709747989),
        (30.620521897109512, -96.34142126895225),
        (30.616903515115933, -96.34234700660507),
        (30.616733648052737, -96.33864169654862),
        (30.619049, -96.33613285869609)
    ],
    "Tuesday": [
        (30.619049, -96.33520431896704),
        (30.620635829152768, -96.33780717084723),
        (30.621539960200952, -96.339394),
        (30.62067694634726, -96.34102194634725),
        (30.619049, -96.34348743962796),
        (30.617745325015008, -96.340697674985),
        (30.615339208284905, -96.339394),
        (30.616045005467267, -96.33639000546727),
        (30.619049, -96.33520431896704)
    ],
    "Wednesday": [
        (30.619049, -96.33589089756462),
        (30.62210503265181, -96.34115840127417),
        (30.616435078615776, -96.34090314821482),
        (30.619049, -96.33589089756462)
    ],
    "Thursday": [
        (30.619049, -96.3367042316001),
        (30.62244322830225, -96.33829114837108),
        (30.6207075949698, -96.34167686012981),
        (30.61720074101315, -96.34193791025385),
        (30.61564898323636, -96.33828926758596),
        (30.619049, -96.3367042316001)
    ],
    "Friday": [
        (30.619049, -96.33701066601088),
        (30.620917019635666, -96.3404725016395),
        (30.616672806242022, -96.34076589610581),
        (30.619049, -96.33701066601088)
    ],
    "Saturday": [
        (30.619049, -96.33542378880597),
        (30.620948755532126, -96.33829717563214),
        (30.62140432839715, -96.34075384948412),
        (30.619049, -96.34181558166715),
        (30.615516081823205, -96.3414337312604),
        (30.615336088727393, -96.33725034967728),
        (30.619049, -96.33542378880597)
    ]
};



shapes = [{"type": "Polygon", "coordinates": [vertices[day]]} for day in vertices.keys()]

max_shape = unary_union([shape(s) for s in shapes])
minx, miny, maxx, maxy = max_shape.bounds
dx = dy = 0.0001  # grid resolution; this can be adjusted

lenx = maxx - minx
leny = maxy - miny

nx = int(lenx / dx)
ny = int(leny / dy)
gt = Affine(
    dx, 0.0, minx,
    0.0, -dy, maxy)

# probability that a polygon covers the grid
# 0.0 (zero coverage) to 1.0 (all covered).

pa = np.zeros((ny, nx), 'd')
for s in shapes:
    r = features.rasterize([s], (ny, nx), transform=gt)
    pa[r > 0] += 1
pa /= len(shapes)  # normalise values

# smooth edges of probability array
spa, sgt = gaussian_blur(pa, gt, 100)

thresh = 0.5  # median
pm = np.zeros(spa.shape, 'B')
pm[spa > thresh] = 1

# convert grid results back to vector
poly_shapes = []
for sh, val in features.shapes(pm, transform=sgt):
    if val == 1:
        poly_shapes.append(shape(sh))
if not any(poly_shapes):
    raise ValueError("could not find any shapes")
avg_poly = unary_union(poly_shapes)

# Simplify the polygon
simp_poly = avg_poly.simplify(sqrt(dx**2 + dy**2))
simp_shape = mapping(simp_poly)

# Final coordinates of average polygon at threshold (double thresh)
print(simp_shape)
