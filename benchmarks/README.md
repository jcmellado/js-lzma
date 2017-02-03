# Benchmarks against some JS competitors

I tried to find the best implementations for different compression algorithms.
The goal was to find the best trade-off between size and performance for
decompression. There might be faster implementations around I was not aware
of, or the methods used in this benchmark may not be the best in all cases.
Please feel free to create Pull Requests to improve this benchmark suite.

I had a hard time to get lz4 working, as most js libraries don't seem to implement
the latest [specs][2]. AFAICS most js lz4 implementations emit [legacy headers][3].

## Test Data

The test data consists of three files derived from the [HYG Star Database][1].
One json file (1.3MB) mapping all star names to the db index. The other two
files are Float32Arrays (1.9MB) for color and position information, with one file
being much noisier than the other. This gives a good mix of different use cases.

[1]: https://github.com/astronexus/HYG-Database

## Results

### System: Core i7-3770 @ 3.90Ghz (16GB RAM)

#### Chrome 55.0.2883.87 (Official Build)

```
TESTING: names
node-lz4 x 95.38 ops/sec ±2.22% (56 runs sampled) (11.76 MB/s - 47.22%)
pako-gz x 50.32 ops/sec ±11.95% (51 runs sampled) (10.72 MB/s - 33.19%)
js-lzma x 6.79 ops/sec ±4.23% (36 runs sampled) (7.53 MB/s - 26.50%)
node-lzma x 1.70 ops/sec ±1.89% (13 runs sampled) (2.08 MB/s - 26.50%)
TESTING: col
node-lz4 x 79.13 ops/sec ±2.32% (54 runs sampled) (16.75 MB/s - 100%)
pako-gz x 26.41 ops/sec ±2.52% (44 runs sampled) (13.67 MB/s - 75.92%)
js-lzma x 3.40 ops/sec ±2.49% (21 runs sampled) (5.81 MB/s - 53.20%)
node-lzma x 0.63 ops/sec ±2.51% (8 runs sampled) (1.13 MB/s - 53.20%)
TESTING: pos
node-lz4 x 74.85 ops/sec ±2.54% (51 runs sampled) (15.88 MB/s - 84.65%)
pako-gz x 29.32 ops/sec ±2.96% (49 runs sampled) (14.73 MB/s - 70.50%)
js-lzma x 3.05 ops/sec ±2.53% (19 runs sampled) (5.24 MB/s - 58.84%)
node-lzma x 0.60 ops/sec ±2.71% (7 runs sampled) (1.09 MB/s - 58.84%)
```

#### Gecko/20100101 Firefox/53.0

```
TESTING: names
js-lzma x 11.70 ops/sec ±3.42% (57 runs sampled) (12.19 MB/s - 26.50%)
pako-gz x 64.00 ops/sec ±24.43% (51 runs sampled) (10.66 MB/s - 33.19%)
node-lz4 x 156 ops/sec ±4.47% (51 runs sampled) (10.45 MB/s - 47.22%)
node-lzma x 0.74 ops/sec ±14.48% (8 runs sampled) (0.92 MB/s - 26.50%)
TESTING: col
pako-gz x 33.99 ops/sec ±6.48% (56 runs sampled) (17.34 MB/s - 75.92%)
node-lz4 x 157 ops/sec ±4.84% (50 runs sampled) (14.64 MB/s - 100%)
js-lzma x 4.90 ops/sec ±3.92% (28 runs sampled) (8.13 MB/s - 53.20%)
node-lzma x 0.43 ops/sec ±4.27% (7 runs sampled) (0.78 MB/s - 53.20%)
TESTING: pos
pako-gz x 37.46 ops/sec ±10.08% (49 runs sampled) (15.09 MB/s - 70.50%)
node-lz4 x 114 ops/sec ±6.75% (46 runs sampled) (14.17 MB/s - 84.65%)
js-lzma x 4.78 ops/sec ±3.57% (28 runs sampled) (8.03 MB/s - 58.84%)
node-lzma x 0.47 ops/sec ±2.79% (7 runs sampled) (0.84 MB/s - 58.84%)
```

#### IE11 Edge/14.14393

```
TESTING: names
pako-gz x 57.39 ops/sec ±2.19% (59 runs sampled) (12.61 MB/s - 33.19%)
node-lz4 x 55.57 ops/sec ±1.71% (57 runs sampled) (12.51 MB/s - 47.22%)
js-lzma x 8.26 ops/sec ±2.84% (44 runs sampled) (9.45 MB/s - 26.50%)
node-lzma x 2.65 ops/sec ±1.86% (17 runs sampled) (3.23 MB/s - 26.50%)
TESTING: col
pako-gz x 22.47 ops/sec ±1.24% (58 runs sampled) (18.39 MB/s - 75.92%)
node-lz4 x 43.54 ops/sec ±1.92% (57 runs sampled) (17.97 MB/s - 100%)
js-lzma x 3.36 ops/sec ±2.09% (21 runs sampled) (5.94 MB/s - 53.20%)
node-lzma x 1.20 ops/sec ±1.25% (11 runs sampled) (2.16 MB/s - 53.20%)
TESTING: pos
pako-gz x 24.48 ops/sec ±1.91% (62 runs sampled) (19.96 MB/s - 70.50%)
node-lz4 x 40.85 ops/sec ±1.41% (53 runs sampled) (16.87 MB/s - 84.65%)
js-lzma x 3.03 ops/sec ±2.82% (19 runs sampled) (5.37 MB/s - 58.84%)
node-lzma x 1.03 ops/sec ±0.92% (10 runs sampled) (1.86 MB/s - 58.84%)
```

### System: Yoga Tablet2 (Intel® Atom™ Z3745 Quad-Core)

#### Chrome/55.0.2883.87

```
TESTING: names
node-lz4 x 27.34 ops/sec ±9.50% (29 runs sampled) (5.67 MB/s - 47.22%)
pako-gz x 13.16 ops/sec ±25.16% (27 runs sampled) (4.89 MB/s - 33.19%)
js-lzma x 1.97 ops/sec ±8.04% (14 runs sampled) (2.34 MB/s - 26.50%)
node-lzma x 0.40 ops/sec ±3.04% (6 runs sampled) (0.50 MB/s - 26.50%)
TESTING: col
node-lz4 x 18.74 ops/sec ±2.24% (32 runs sampled) (9.39 MB/s - 100%)
pako-gz x 7.87 ops/sec ±18.72% (25 runs sampled) (6.85 MB/s - 75.92%)
js-lzma x 0.87 ops/sec ±4.86% (9 runs sampled) (1.54 MB/s - 53.20%)
node-lzma x 0.15 ops/sec ±3.09% (5 runs sampled) (0.28 MB/s - 53.20%)
TESTING: pos
node-lz4 x 18.91 ops/sec ±2.68% (32 runs sampled) (9.52 MB/s - 84.65%)
pako-gz x 8.51 ops/sec ±2.57% (24 runs sampled) (6.77 MB/s - 70.50%)
js-lzma x 0.85 ops/sec ±5.50% (9 runs sampled) (1.51 MB/s - 58.84%)
node-lzma x 0.15 ops/sec ±1.12% (5 runs sampled) (0.27 MB/s - 58.84%)
```

#### Gecko/20100101 Firefox/44.0

```
TESTING: names
pako-gz x 18.00 ops/sec ±21.31% (42 runs sampled) (7.77 MB/s - 33.19%)
node-lz4 x 46.63 ops/sec ±16.51% (39 runs sampled) (7.50 MB/s - 47.22%)
js-lzma x 2.23 ops/sec ±12.43% (15 runs sampled) (2.46 MB/s - 26.50%)
node-lzma x 0.17 ops/sec ±3.87% (5 runs sampled) (0.21 MB/s - 26.50%)
TESTING: col
pako-gz x 9.04 ops/sec ±16.07% (40 runs sampled) (10.67 MB/s - 75.92%)
node-lz4 x 54.70 ops/sec ±18.82% (36 runs sampled) (9.52 MB/s - 100%)
js-lzma x 1.13 ops/sec ±8.53% (10 runs sampled) (1.89 MB/s - 53.20%)
node-lzma x 0.10 ops/sec ±2.97% (5 runs sampled) (0.18 MB/s - 53.20%)
TESTING: pos
pako-gz x 10.55 ops/sec ±6.63% (41 runs sampled) (11.70 MB/s - 70.50%)
node-lz4 x 37.16 ops/sec ±18.43% (38 runs sampled) (9.80 MB/s - 84.65%)
js-lzma x 1.13 ops/sec ±7.38% (10 runs sampled) (1.90 MB/s - 58.84%)
node-lzma x 0.09 ops/sec ±2.21% (5 runs sampled) (0.17 MB/s - 58.84%)
```

#### IE11 Edge/14.14393

```
TESTING: names
node-lz4 x 11.80 ops/sec ±1.55% (52 runs sampled) (10.66 MB/s - 47.22%)
pako-gz x 17.08 ops/sec ±11.58% (43 runs sampled) (8.82 MB/s - 33.19%)
js-lzma x 1.73 ops/sec ±8.05% (13 runs sampled) (2.03 MB/s - 26.50%)
node-lzma x 0.51 ops/sec ±2.46% (7 runs sampled) (0.63 MB/s - 26.50%)
TESTING: col
node-lz4 x 8.76 ops/sec ±0.57% (41 runs sampled) (12.44 MB/s - 100%)
pako-gz x 7.60 ops/sec ±1.58% (37 runs sampled) (11.36 MB/s - 75.92%)
js-lzma x 0.68 ops/sec ±4.09% (8 runs sampled) (1.20 MB/s - 53.20%)
node-lzma x 0.21 ops/sec ±2.87% (6 runs sampled) (0.38 MB/s - 53.20%)
TESTING: pos
node-lz4 x 8.38 ops/sec ±0.79% (40 runs sampled) (11.99 MB/s - 84.65%)
pako-gz x 7.97 ops/sec ±1.75% (39 runs sampled) (11.88 MB/s - 70.50%)
js-lzma x 0.71 ops/sec ±3.36% (8 runs sampled) (1.25 MB/s - 58.84%)
node-lzma x 0.19 ops/sec ±0.66% (5 runs sampled) (0.34 MB/s - 58.84%)
```

### System: ZTE Blade V6 (Quad-core 1.3 GHz Cortex-A53)

#### Chrome 55.0.2883.91

```
TESTING: names
pako-gz x 8.52 ops/sec ±15.25% (40 runs sampled) (7.61 MB/s - 33.19%)
node-lz4 x 14.87 ops/sec ±25.36% (39 runs sampled) (7.45 MB/s - 47.22%)
js-lzma x 0.80 ops/sec ±8.13% (9 runs sampled) (0.96 MB/s - 26.50%)
node-lzma x 0.23 ops/sec ±3.85% (6 runs sampled) (0.29 MB/s - 26.50%)
TESTING: col
node-lz4 x 14.61 ops/sec ±2.19% (33 runs sampled) (9.63 MB/s - 100%)
pako-gz x 4.06 ops/sec ±18.40% (24 runs sampled) (6.25 MB/s - 75.92%)
js-lzma x 0.36 ops/sec ±1.04% (6 runs sampled) (0.64 MB/s - 53.20%)
node-lzma x 0.08 ops/sec ±0.66% (5 runs sampled) (0.15 MB/s - 53.20%)
TESTING: pos
node-lz4 x 13.37 ops/sec ±1.68% (32 runs sampled) (9.55 MB/s - 84.65%)
pako-gz x 4.79 ops/sec ±5.55% (26 runs sampled) (7.32 MB/s - 70.50%)
js-lzma x 0.35 ops/sec ±5.29% (6 runs sampled) (0.62 MB/s - 58.84%)
node-lzma x 0.02 ops/sec ±199.73% (5 runs sampled) (0.04 MB/s - 58.84%)
```

## Conclusion

As we can see, `js-lzma` performs very well in comparison to pako-gz. I
expected more throughput from the `lz4` implementation, as this should be
the strength of lz4. We can see that `lz4` gains ground when the CPU gets
weaker, which seems logical. Pako seems to be well optimized and performs
good on all major browser, but so does `js-lzma`. With weaker hardware the
gap gets bigger between `pako` and `js-lzma`. Unfortunately `node-lz4` loses
to `pako` in pretty much all cases (somtimes slower with worse compression
ratio). Also `node-lzma` does not come close to the performance of `js-lzma`.
Interestingly in Firefox on Desktops the json use case decompresses even faster
with `js-lzma` than with `pako`.

If you really need more speed, you should stick to pako libz for the best
throughput to compression ration. Otherwise, if your data does not exceed
a few MB, you should use `js-lzma` for best compression with reasonable speed!

[2]: https://docs.google.com/document/d/1cl8N1bmkTdIpPLtnlzbBSFAdUeyNo5fwfHbHU7VRNWY/edit
[3]: http://justsolve.archiveteam.org/wiki/LZ4

## Tested Implementations

- https://github.com/nodeca/pako
- https://github.com/nmrugg/LZMA-JS
- https://github.com/pierrec/node-lz4
- https://github.com/jcmellado/js-lzma

