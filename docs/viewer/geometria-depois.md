# Geometria 3D — depois

Medido em 26/10/2026, depois de `node tools/build-molecule-coords.mjs`, a partir de `netlify/lib/viewer-molecule-coords.mjs`.
Antes da reescrita, `node tools/test-molecule-geometry.mjs` falhou em 123 checagens de 23 moléculas. Depois, passou nas 42.
Moléculas reescritas usam 1 unidade = 1 Å. As que o teste já aprovava conservam a escala didática anterior (água O–H 1,121; CO₂ 1,60; benzeno C–C 1,20; metano e CHFClBr 1,732).
`name`, `desc`, `draw2d`, `r`, `color`, `bonds` e a ordem dos átomos não mudaram. O desenho 2D do etanol já tinha C–C ~2,0 e C–O ~1,8 (razão próxima de 1,512/1,431) e não foi redesenhado.
Status `ok` significa que os números testados foram conferidos na fonte nesta data. `verified:false` fica para revisão docente.

## water

Status: ok. Reescrita: não.

Geometria angular (104,5°) · Polar · Pontes de hidrogênio

Átomos: O H H

| Ligação | Comprimento |
|---|---:|
| O-H (0–1) | 1.121 |
| O-H (0–2) | 1.121 |

| Ângulo | Graus |
|---|---:|
| H-O-H (1–0–2) | 104.5 |

Ângulo H–O–H conferido: 104.50°

## ethanol

Status: ok. Reescrita: sim.

Cadeia aberta · Grupo hidroxila OH · Polar e apolar

Átomos: C C O H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.512 |
| C-O (1–2) | 1.431 |
| O-H (2–3) | 0.971 |
| C-H (0–4) | 1.090 |
| C-H (0–5) | 1.090 |
| C-H (0–6) | 1.090 |
| C-H (1–7) | 1.090 |
| C-H (1–8) | 1.090 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 109.0 |
| C-C-H (1–0–5) | 109.0 |
| C-C-H (1–0–6) | 109.0 |
| H-C-H (4–0–5) | 109.9 |
| H-C-H (4–0–6) | 109.9 |
| H-C-H (5–0–6) | 109.9 |
| C-C-O (0–1–2) | 107.8 |
| C-C-H (0–1–7) | 112.0 |
| C-C-H (0–1–8) | 112.0 |
| O-C-H (2–1–7) | 109.1 |
| O-C-H (2–1–8) | 109.1 |
| H-C-H (7–1–8) | 106.8 |
| C-O-H (1–2–3) | 105.4 |

## butane

Status: verified:false. Reescrita: sim.

Linear alkane · chain isomer reference

Átomos: C C C C H H H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.531 |
| C-C (1–2) | 1.531 |
| C-C (2–3) | 1.531 |
| C-H (0–4) | 1.117 |
| C-H (0–5) | 1.117 |
| C-H (0–6) | 1.117 |
| C-H (1–7) | 1.117 |
| C-H (1–8) | 1.117 |
| C-H (2–9) | 1.117 |
| C-H (2–10) | 1.117 |
| C-H (3–11) | 1.117 |
| C-H (3–12) | 1.117 |
| C-H (3–13) | 1.117 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 111.0 |
| C-C-H (1–0–5) | 111.0 |
| C-C-H (1–0–6) | 111.0 |
| H-C-H (4–0–5) | 107.9 |
| H-C-H (4–0–6) | 107.9 |
| H-C-H (5–0–6) | 107.9 |
| C-C-C (0–1–2) | 113.8 |
| C-C-H (0–1–7) | 111.0 |
| C-C-H (0–1–8) | 111.0 |
| C-C-H (2–1–7) | 106.4 |
| C-C-H (2–1–8) | 106.4 |
| H-C-H (7–1–8) | 107.9 |
| C-C-C (1–2–3) | 113.8 |
| C-C-H (1–2–9) | 111.0 |
| C-C-H (1–2–10) | 111.0 |
| C-C-H (3–2–9) | 106.4 |
| C-C-H (3–2–10) | 106.4 |
| H-C-H (9–2–10) | 107.9 |
| C-C-H (2–3–11) | 111.0 |
| C-C-H (2–3–12) | 111.0 |
| C-C-H (2–3–13) | 111.0 |
| H-C-H (11–3–12) | 107.9 |
| H-C-H (11–3–13) | 107.9 |
| H-C-H (12–3–13) | 107.9 |

Diedro 0–1–2–3: -180.0°

## isobutane

Status: verified:false. Reescrita: sim.

Branched alkane · 2-methylpropane

Átomos: C C C C H H H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.535 |
| C-C (0–2) | 1.535 |
| C-C (0–3) | 1.535 |
| C-H (0–4) | 1.100 |
| C-H (1–5) | 1.100 |
| C-H (1–6) | 1.100 |
| C-H (1–7) | 1.100 |
| C-H (2–8) | 1.100 |
| C-H (2–9) | 1.100 |
| C-H (2–10) | 1.100 |
| C-H (3–11) | 1.100 |
| C-H (3–12) | 1.100 |
| C-H (3–13) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-C (1–0–2) | 111.1 |
| C-C-C (1–0–3) | 111.1 |
| C-C-H (1–0–4) | 107.7 |
| C-C-C (2–0–3) | 111.2 |
| C-C-H (2–0–4) | 107.7 |
| C-C-H (3–0–4) | 107.7 |
| C-C-H (0–1–5) | 110.0 |
| C-C-H (0–1–6) | 110.0 |
| C-C-H (0–1–7) | 110.0 |
| H-C-H (5–1–6) | 108.9 |
| H-C-H (5–1–7) | 108.9 |
| H-C-H (6–1–7) | 108.9 |
| C-C-H (0–2–8) | 110.0 |
| C-C-H (0–2–9) | 110.0 |
| C-C-H (0–2–10) | 110.0 |
| H-C-H (8–2–9) | 108.9 |
| H-C-H (8–2–10) | 108.9 |
| H-C-H (9–2–10) | 108.9 |
| C-C-H (0–3–11) | 110.0 |
| C-C-H (0–3–12) | 110.0 |
| C-C-H (0–3–13) | 110.0 |
| H-C-H (11–3–12) | 108.9 |
| H-C-H (11–3–13) | 108.9 |
| H-C-H (12–3–13) | 108.9 |

## but1ene

Status: verified:false. Reescrita: sim.

Terminal C=C double bond (position isomerism)

Átomos: C C C C H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.340 |
| C-C (1–2) | 1.508 |
| C-C (2–3) | 1.508 |
| C-H (0–4) | 1.080 |
| C-H (0–5) | 1.080 |
| C-H (1–6) | 1.080 |
| C-H (2–7) | 1.100 |
| C-H (2–8) | 1.100 |
| C-H (3–9) | 1.100 |
| C-H (3–10) | 1.100 |
| C-H (3–11) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 121.0 |
| C-C-H (1–0–5) | 121.0 |
| H-C-H (4–0–5) | 118.0 |
| C-C-C (0–1–2) | 125.0 |
| C-C-H (0–1–6) | 117.0 |
| C-C-H (2–1–6) | 118.0 |
| C-C-C (1–2–3) | 113.8 |
| C-C-H (1–2–7) | 109.5 |
| C-C-H (1–2–8) | 109.5 |
| C-C-H (3–2–7) | 107.3 |
| C-C-H (3–2–8) | 107.3 |
| H-C-H (7–2–8) | 109.5 |
| C-C-H (2–3–9) | 110.0 |
| C-C-H (2–3–10) | 110.0 |
| C-C-H (2–3–11) | 110.0 |
| H-C-H (9–3–10) | 108.9 |
| H-C-H (9–3–11) | 108.9 |
| H-C-H (10–3–11) | 108.9 |

## but2ene

Status: verified:false. Reescrita: sim.

Internal C=C double bond

Átomos: C C C C H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.508 |
| C-C (1–2) | 1.340 |
| C-C (2–3) | 1.508 |
| C-H (0–4) | 1.100 |
| C-H (0–5) | 1.100 |
| C-H (0–6) | 1.100 |
| C-H (1–7) | 1.080 |
| C-H (2–8) | 1.080 |
| C-H (3–9) | 1.100 |
| C-H (3–10) | 1.100 |
| C-H (3–11) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 110.0 |
| C-C-H (1–0–5) | 110.0 |
| C-C-H (1–0–6) | 110.0 |
| H-C-H (4–0–5) | 108.9 |
| H-C-H (4–0–6) | 108.9 |
| H-C-H (5–0–6) | 108.9 |
| C-C-C (0–1–2) | 125.0 |
| C-C-H (0–1–7) | 118.0 |
| C-C-H (2–1–7) | 117.0 |
| C-C-C (1–2–3) | 125.0 |
| C-C-H (1–2–8) | 118.0 |
| C-C-H (3–2–8) | 117.0 |
| C-C-H (2–3–9) | 110.0 |
| C-C-H (2–3–10) | 110.0 |
| C-C-H (2–3–11) | 110.0 |
| H-C-H (9–3–10) | 108.9 |
| H-C-H (9–3–11) | 108.9 |
| H-C-H (10–3–11) | 108.9 |

Diedro 0–1–2–3: -180.0°

## cis2butene

Status: verified:false. Reescrita: sim.

Geometric isomer · CH₃ groups on same side

Átomos: C C C C H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.508 |
| C-C (1–2) | 1.340 |
| C-C (2–3) | 1.508 |
| C-H (0–4) | 1.100 |
| C-H (0–5) | 1.100 |
| C-H (0–6) | 1.100 |
| C-H (1–7) | 1.080 |
| C-H (2–8) | 1.080 |
| C-H (3–9) | 1.100 |
| C-H (3–10) | 1.100 |
| C-H (3–11) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 110.0 |
| C-C-H (1–0–5) | 110.0 |
| C-C-H (1–0–6) | 110.0 |
| H-C-H (4–0–5) | 108.9 |
| H-C-H (4–0–6) | 108.9 |
| H-C-H (5–0–6) | 108.9 |
| C-C-C (0–1–2) | 125.0 |
| C-C-H (0–1–7) | 118.0 |
| C-C-H (2–1–7) | 117.0 |
| C-C-C (1–2–3) | 125.0 |
| C-C-H (1–2–8) | 118.0 |
| C-C-H (3–2–8) | 117.0 |
| C-C-H (2–3–9) | 110.0 |
| C-C-H (2–3–10) | 110.0 |
| C-C-H (2–3–11) | 110.0 |
| H-C-H (9–3–10) | 108.9 |
| H-C-H (9–3–11) | 108.9 |
| H-C-H (10–3–11) | 108.9 |

Diedro 0–1–2–3: 0.0°

## trans2butene

Status: verified:false. Reescrita: sim.

Geometric isomer · CH₃ groups on opposite sides

Átomos: C C C C H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.508 |
| C-C (1–2) | 1.340 |
| C-C (2–3) | 1.508 |
| C-H (0–4) | 1.100 |
| C-H (0–5) | 1.100 |
| C-H (0–6) | 1.100 |
| C-H (1–7) | 1.080 |
| C-H (2–8) | 1.080 |
| C-H (3–9) | 1.100 |
| C-H (3–10) | 1.100 |
| C-H (3–11) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 110.0 |
| C-C-H (1–0–5) | 110.0 |
| C-C-H (1–0–6) | 110.0 |
| H-C-H (4–0–5) | 108.9 |
| H-C-H (4–0–6) | 108.9 |
| H-C-H (5–0–6) | 108.9 |
| C-C-C (0–1–2) | 125.0 |
| C-C-H (0–1–7) | 118.0 |
| C-C-H (2–1–7) | 117.0 |
| C-C-C (1–2–3) | 125.0 |
| C-C-H (1–2–8) | 118.0 |
| C-C-H (3–2–8) | 117.0 |
| C-C-H (2–3–9) | 110.0 |
| C-C-H (2–3–10) | 110.0 |
| C-C-H (2–3–11) | 110.0 |
| H-C-H (9–3–10) | 108.9 |
| H-C-H (9–3–11) | 108.9 |
| H-C-H (10–3–11) | 108.9 |

Diedro 0–1–2–3: -180.0°

## dimethylether

Status: ok. Reescrita: sim.

Functional/metameric isomer of ethanol

Átomos: C O C H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-O (0–1) | 1.411 |
| O-C (1–2) | 1.411 |
| C-H (0–3) | 1.090 |
| C-H (0–4) | 1.090 |
| C-H (0–5) | 1.090 |
| C-H (2–6) | 1.090 |
| C-H (2–7) | 1.090 |
| C-H (2–8) | 1.090 |

| Ângulo | Graus |
|---|---:|
| O-C-H (1–0–3) | 110.0 |
| O-C-H (1–0–4) | 110.0 |
| O-C-H (1–0–5) | 110.0 |
| H-C-H (3–0–4) | 108.9 |
| H-C-H (3–0–5) | 108.9 |
| H-C-H (4–0–5) | 108.9 |
| C-O-C (0–1–2) | 111.2 |
| O-C-H (1–2–6) | 110.0 |
| O-C-H (1–2–7) | 110.0 |
| O-C-H (1–2–8) | 110.0 |
| H-C-H (6–2–7) | 108.9 |
| H-C-H (6–2–8) | 108.9 |
| H-C-H (7–2–8) | 108.9 |

## acetone

Status: ok. Reescrita: sim.

Keto form (tautomerism reference)

Átomos: C C C O H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.520 |
| C-C (1–2) | 1.520 |
| C-O (1–3) | 1.214 |
| C-H (0–4) | 1.103 |
| C-H (0–5) | 1.103 |
| C-H (0–6) | 1.103 |
| C-H (2–7) | 1.103 |
| C-H (2–8) | 1.103 |
| C-H (2–9) | 1.103 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 110.5 |
| C-C-H (1–0–5) | 110.5 |
| C-C-H (1–0–6) | 110.5 |
| H-C-H (4–0–5) | 108.4 |
| H-C-H (4–0–6) | 108.4 |
| H-C-H (5–0–6) | 108.4 |
| C-C-C (0–1–2) | 116.0 |
| C-C-O (0–1–3) | 122.0 |
| C-C-O (2–1–3) | 122.0 |
| C-C-H (1–2–7) | 110.5 |
| C-C-H (1–2–8) | 110.5 |
| C-C-H (1–2–9) | 110.5 |
| H-C-H (7–2–8) | 108.4 |
| H-C-H (7–2–9) | 108.4 |
| H-C-H (8–2–9) | 108.4 |

Desvio do plano (0,1,2,3): 0.000

## methyl-isocyanate

Status: verified:false. Reescrita: não.

Volatile isocyanate · Linear N=C=O group · Bhopal gas

Átomos: C N C O H H H

| Ligação | Comprimento |
|---|---:|
| C-N (0–1) | 1.309 |
| N-C (1–2) | 1.250 |
| C-O (2–3) | 1.200 |
| C-H (0–4) | 1.030 |
| C-H (0–5) | 1.221 |
| C-H (0–6) | 1.221 |

| Ângulo | Graus |
|---|---:|
| N-C-H (1–0–4) | 165.6 |
| N-C-H (1–0–5) | 103.9 |
| N-C-H (1–0–6) | 103.9 |
| H-C-H (4–0–5) | 87.0 |
| H-C-H (4–0–6) | 87.0 |
| H-C-H (5–0–6) | 79.4 |
| C-N-C (0–1–2) | 133.5 |
| N-C-O (1–2–3) | 180.0 |

## co2

Status: ok. Reescrita: não.

Geometria linear · Apolar · Duplas C=O

Átomos: C O O

| Ligação | Comprimento |
|---|---:|
| C-O (0–1) | 1.600 |
| C-O (0–2) | 1.600 |

| Ângulo | Graus |
|---|---:|
| O-C-O (1–0–2) | 180.0 |

## ammonia

Status: verified:false. Reescrita: não.

Geometria piramidal trigonal · Polar · Básica

Átomos: N H H H

| Ligação | Comprimento |
|---|---:|
| N-H (0–1) | 1.077 |
| N-H (0–2) | 1.077 |
| N-H (0–3) | 1.077 |

| Ângulo | Graus |
|---|---:|
| H-N-H (1–0–2) | 107.0 |
| H-N-H (1–0–3) | 107.0 |
| H-N-H (2–0–3) | 107.0 |

## methane

Status: ok. Reescrita: não.

Geometria tetraédrica · Apolar · Gás natural

Átomos: C H H H H

| Ligação | Comprimento |
|---|---:|
| C-H (0–1) | 1.732 |
| C-H (0–2) | 1.732 |
| C-H (0–3) | 1.732 |
| C-H (0–4) | 1.732 |

| Ângulo | Graus |
|---|---:|
| H-C-H (1–0–2) | 109.5 |
| H-C-H (1–0–3) | 109.5 |
| H-C-H (1–0–4) | 109.5 |
| H-C-H (2–0–3) | 109.5 |
| H-C-H (2–0–4) | 109.5 |
| H-C-H (3–0–4) | 109.5 |

## hcl

Status: verified:false. Reescrita: não.

Linear · Polar · Ácido forte · Diatômico

Átomos: H Cl

| Ligação | Comprimento |
|---|---:|
| H-Cl (0–1) | 1.400 |

| Ângulo | Graus |
|---|---:|

## nacl

Status: verified:false. Reescrita: não.

Ligação iônica · Par Na⁺Cl⁻

Átomos: Na Cl

| Ligação | Comprimento |
|---|---:|
| Na-Cl (0–1) | 2.300 |

| Ângulo | Graus |
|---|---:|

## h2so4

Status: verified:false. Reescrita: sim.

Tetraédrica em torno do S · Diprótico · Ác. forte

Átomos: S O O O O H H

| Ligação | Comprimento |
|---|---:|
| S-O (0–1) | 1.430 |
| S-O (0–2) | 1.430 |
| S-O (0–3) | 1.570 |
| S-O (0–4) | 1.570 |
| O-H (3–5) | 0.960 |
| O-H (4–6) | 0.960 |

| Ângulo | Graus |
|---|---:|
| O-S-O (1–0–2) | 123.0 |
| O-S-O (1–0–3) | 106.0 |
| O-S-O (1–0–4) | 106.0 |
| O-S-O (2–0–3) | 106.0 |
| O-S-O (2–0–4) | 106.0 |
| O-S-O (3–0–4) | 109.4 |
| S-O-H (0–3–5) | 108.0 |
| S-O-H (0–4–6) | 108.0 |

## h3po4

Status: verified:false. Reescrita: sim.

Tetraédrica em torno do P · DNA, ATP, fertilizantes

Átomos: P O O O O H H H

| Ligação | Comprimento |
|---|---:|
| P-O (0–1) | 1.480 |
| P-O (0–2) | 1.550 |
| P-O (0–3) | 1.550 |
| P-O (0–4) | 1.550 |
| O-H (2–5) | 0.960 |
| O-H (3–6) | 0.960 |
| O-H (4–7) | 0.960 |

| Ângulo | Graus |
|---|---:|
| O-P-O (1–0–2) | 109.5 |
| O-P-O (1–0–3) | 109.5 |
| O-P-O (1–0–4) | 109.5 |
| O-P-O (2–0–3) | 109.5 |
| O-P-O (2–0–4) | 109.5 |
| O-P-O (3–0–4) | 109.5 |
| P-O-H (0–2–5) | 110.0 |
| P-O-H (0–3–6) | 110.0 |
| P-O-H (0–4–7) | 110.0 |

## fe2o3

Status: verified:false. Reescrita: não.

Rede cristalina hematita · Óxido férrico · Corrosão

Átomos: Fe Fe O O O

| Ligação | Comprimento |
|---|---:|
| Fe-O (0–2) | 1.720 |
| Fe-O (0–3) | 1.720 |
| Fe-O (0–4) | 1.720 |
| Fe-O (1–2) | 1.720 |
| Fe-O (1–3) | 1.720 |
| Fe-O (1–4) | 1.720 |

| Ângulo | Graus |
|---|---:|
| O-Fe-O (2–0–3) | 71.1 |
| O-Fe-O (2–0–4) | 48.5 |
| O-Fe-O (3–0–4) | 48.5 |
| O-Fe-O (2–1–3) | 71.1 |
| O-Fe-O (2–1–4) | 48.5 |
| O-Fe-O (3–1–4) | 48.5 |
| Fe-O-Fe (0–2–1) | 108.9 |
| Fe-O-Fe (0–3–1) | 108.9 |
| Fe-O-Fe (0–4–1) | 108.9 |

## chfclbr

Status: ok. Reescrita: não.

Tetrahedral geometry · Chiral · Asymmetric carbon (4 different groups)

Átomos: C H F Cl Br

| Ligação | Comprimento |
|---|---:|
| C-H (0–1) | 1.732 |
| C-F (0–2) | 1.732 |
| C-Cl (0–3) | 1.732 |
| C-Br (0–4) | 1.732 |

| Ângulo | Graus |
|---|---:|
| H-C-F (1–0–2) | 109.5 |
| H-C-Cl (1–0–3) | 109.5 |
| H-C-Br (1–0–4) | 109.5 |
| F-C-Cl (2–0–3) | 109.5 |
| F-C-Br (2–0–4) | 109.5 |
| Cl-C-Br (3–0–4) | 109.5 |

## bromobutane

Status: verified:false. Reescrita: sim.

Asymmetric carbon at C2 · Chiral · Alkyl halide

Átomos: C C C C Br H H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.531 |
| C-C (1–2) | 1.531 |
| C-C (2–3) | 1.531 |
| C-Br (1–4) | 1.940 |
| C-H (0–5) | 1.100 |
| C-H (0–6) | 1.100 |
| C-H (0–7) | 1.100 |
| C-H (1–8) | 1.100 |
| C-H (2–9) | 1.100 |
| C-H (2–10) | 1.100 |
| C-H (3–11) | 1.100 |
| C-H (3–12) | 1.100 |
| C-H (3–13) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–5) | 110.0 |
| C-C-H (1–0–6) | 110.0 |
| C-C-H (1–0–7) | 110.0 |
| H-C-H (5–0–6) | 108.9 |
| H-C-H (5–0–7) | 108.9 |
| H-C-H (6–0–7) | 108.9 |
| C-C-C (0–1–2) | 112.0 |
| C-C-Br (0–1–4) | 109.5 |
| C-C-H (0–1–8) | 109.5 |
| C-C-Br (2–1–4) | 108.2 |
| C-C-H (2–1–8) | 108.2 |
| Br-C-H (4–1–8) | 109.5 |
| C-C-C (1–2–3) | 113.8 |
| C-C-H (1–2–9) | 109.5 |
| C-C-H (1–2–10) | 109.5 |
| C-C-H (3–2–9) | 107.3 |
| C-C-H (3–2–10) | 107.3 |
| H-C-H (9–2–10) | 109.5 |
| C-C-H (2–3–11) | 110.0 |
| C-C-H (2–3–12) | 110.0 |
| C-C-H (2–3–13) | 110.0 |
| H-C-H (11–3–12) | 108.9 |
| H-C-H (11–3–13) | 108.9 |
| H-C-H (12–3–13) | 108.9 |

## lacticacid

Status: verified:false. Reescrita: sim.

Asymmetric carbon at C2 · Chiral · Biological (muscle)

Átomos: C C C O H O O H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.520 |
| C-C (1–2) | 1.520 |
| C-O (1–3) | 1.430 |
| O-H (3–4) | 0.960 |
| C-O (2–5) | 1.210 |
| C-O (2–6) | 1.360 |
| O-H (6–7) | 0.970 |
| C-H (1–8) | 1.100 |
| C-H (0–9) | 1.100 |
| C-H (0–10) | 1.100 |
| C-H (0–11) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–9) | 110.0 |
| C-C-H (1–0–10) | 110.0 |
| C-C-H (1–0–11) | 110.0 |
| H-C-H (9–0–10) | 108.9 |
| H-C-H (9–0–11) | 108.9 |
| H-C-H (10–0–11) | 108.9 |
| C-C-C (0–1–2) | 109.5 |
| C-C-O (0–1–3) | 109.5 |
| C-C-H (0–1–8) | 109.5 |
| C-C-O (2–1–3) | 109.5 |
| C-C-H (2–1–8) | 109.5 |
| O-C-H (3–1–8) | 109.5 |
| C-C-O (1–2–5) | 125.0 |
| C-C-O (1–2–6) | 111.0 |
| O-C-O (5–2–6) | 124.0 |
| C-O-H (1–3–4) | 108.0 |
| C-O-H (2–6–7) | 106.0 |

## alanine

Status: verified:false. Reescrita: sim.

Natural amino acid (L-alanine) · Chiral at α-C

Átomos: C C C N H H O O H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.520 |
| C-C (1–2) | 1.520 |
| C-N (1–3) | 1.470 |
| N-H (3–4) | 1.010 |
| N-H (3–5) | 1.010 |
| C-O (2–6) | 1.210 |
| C-O (2–7) | 1.360 |
| O-H (7–8) | 0.970 |
| C-H (1–9) | 1.100 |
| C-H (0–10) | 1.100 |
| C-H (0–11) | 1.100 |
| C-H (0–12) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–10) | 110.0 |
| C-C-H (1–0–11) | 110.0 |
| C-C-H (1–0–12) | 110.0 |
| H-C-H (10–0–11) | 108.9 |
| H-C-H (10–0–12) | 108.9 |
| H-C-H (11–0–12) | 108.9 |
| C-C-C (0–1–2) | 109.5 |
| C-C-N (0–1–3) | 109.5 |
| C-C-H (0–1–9) | 109.5 |
| C-C-N (2–1–3) | 109.5 |
| C-C-H (2–1–9) | 109.5 |
| N-C-H (3–1–9) | 109.5 |
| C-C-O (1–2–6) | 125.0 |
| C-C-O (1–2–7) | 111.0 |
| O-C-O (6–2–7) | 124.0 |
| C-N-H (1–3–4) | 110.0 |
| C-N-H (1–3–5) | 110.0 |
| H-N-H (4–3–5) | 108.9 |
| C-O-H (2–7–8) | 106.0 |

## glyceraldehyde

Status: verified:false. Reescrita: sim.

Simplest triose · Fischer reference for D/L · Chiral at C2

Átomos: C O H C H O H C H H O H

| Ligação | Comprimento |
|---|---:|
| C-O (0–1) | 1.210 |
| C-H (0–2) | 1.110 |
| C-C (0–3) | 1.510 |
| C-H (3–4) | 1.100 |
| C-O (3–5) | 1.430 |
| O-H (5–6) | 0.960 |
| C-C (3–7) | 1.510 |
| C-H (7–8) | 1.100 |
| C-H (7–9) | 1.100 |
| C-O (7–10) | 1.430 |
| O-H (10–11) | 0.960 |

| Ângulo | Graus |
|---|---:|
| O-C-H (1–0–2) | 120.0 |
| O-C-C (1–0–3) | 120.0 |
| H-C-C (2–0–3) | 120.0 |
| C-C-H (0–3–4) | 109.5 |
| C-C-O (0–3–5) | 109.5 |
| C-C-C (0–3–7) | 109.5 |
| H-C-O (4–3–5) | 109.5 |
| H-C-C (4–3–7) | 109.5 |
| O-C-C (5–3–7) | 109.5 |
| C-O-H (3–5–6) | 108.0 |
| C-C-H (3–7–8) | 109.5 |
| C-C-H (3–7–9) | 109.5 |
| C-C-O (3–7–10) | 109.5 |
| H-C-H (8–7–9) | 109.5 |
| H-C-O (8–7–10) | 109.5 |
| H-C-O (9–7–10) | 109.5 |
| C-O-H (7–10–11) | 108.0 |

## n2

Status: verified:false. Reescrita: não.

Linear · Triple bond N≡N · 78% of air

Átomos: N N

| Ligação | Comprimento |
|---|---:|
| N-N (0–1) | 1.600 |

| Ângulo | Graus |
|---|---:|

## o2

Status: verified:false. Reescrita: não.

Linear · Double bond O=O · Essential for respiration

Átomos: O O

| Ligação | Comprimento |
|---|---:|
| O-O (0–1) | 1.600 |

| Ângulo | Graus |
|---|---:|

## benzene

Status: ok. Reescrita: não.

Aromatic · Planar hexagonal ring · Resonance

Átomos: C C C C C C H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.200 |
| C-C (1–2) | 1.200 |
| C-C (2–3) | 1.200 |
| C-C (3–4) | 1.200 |
| C-C (4–5) | 1.200 |
| C-C (5–0) | 1.200 |
| C-H (0–6) | 0.900 |
| C-H (1–7) | 0.900 |
| C-H (2–8) | 0.900 |
| C-H (3–9) | 0.900 |
| C-H (4–10) | 0.900 |
| C-H (5–11) | 0.900 |

| Ângulo | Graus |
|---|---:|
| C-C-C (1–0–5) | 120.0 |
| C-C-H (1–0–6) | 120.0 |
| C-C-H (5–0–6) | 120.0 |
| C-C-C (0–1–2) | 120.0 |
| C-C-H (0–1–7) | 120.0 |
| C-C-H (2–1–7) | 120.0 |
| C-C-C (1–2–3) | 120.0 |
| C-C-H (1–2–8) | 120.0 |
| C-C-H (3–2–8) | 120.0 |
| C-C-C (2–3–4) | 120.0 |
| C-C-H (2–3–9) | 120.0 |
| C-C-H (4–3–9) | 120.0 |
| C-C-C (3–4–5) | 120.0 |
| C-C-H (3–4–10) | 120.0 |
| C-C-H (5–4–10) | 120.0 |
| C-C-C (4–5–0) | 120.0 |
| C-C-H (4–5–11) | 120.0 |
| C-C-H (0–5–11) | 120.0 |

Desvio do plano (0,1,2,3,4,5): 0.000

## methanol

Status: ok. Reescrita: sim.

Simplest alcohol · Polar · Fuel and solvent

Átomos: C O H H H H

| Ligação | Comprimento |
|---|---:|
| C-O (0–1) | 1.427 |
| O-H (1–2) | 0.956 |
| C-H (0–3) | 1.096 |
| C-H (0–4) | 1.096 |
| C-H (0–5) | 1.096 |

| Ângulo | Graus |
|---|---:|
| O-C-H (1–0–3) | 109.9 |
| O-C-H (1–0–4) | 109.9 |
| O-C-H (1–0–5) | 109.9 |
| H-C-H (3–0–4) | 109.0 |
| H-C-H (3–0–5) | 109.0 |
| H-C-H (4–0–5) | 109.0 |
| C-O-H (0–1–2) | 108.9 |

## aceticacid

Status: verified:false. Reescrita: sim.

Vinegar · Carboxyl group COOH · Weak acid

Átomos: C C O O H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.517 |
| C-O (1–2) | 1.212 |
| C-O (1–3) | 1.361 |
| O-H (3–4) | 0.970 |
| C-H (0–5) | 1.100 |
| C-H (0–6) | 1.100 |
| C-H (0–7) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–5) | 110.0 |
| C-C-H (1–0–6) | 110.0 |
| C-C-H (1–0–7) | 110.0 |
| H-C-H (5–0–6) | 108.9 |
| H-C-H (5–0–7) | 108.9 |
| H-C-H (6–0–7) | 108.9 |
| C-C-O (0–1–2) | 126.6 |
| C-C-O (0–1–3) | 110.6 |
| O-C-O (2–1–3) | 122.8 |
| C-O-H (1–3–4) | 106.0 |

## h2o2

Status: ok. Reescrita: sim.

Skewed O–O · Antiseptic and bleach · Reactive

Átomos: O O H H

| Ligação | Comprimento |
|---|---:|
| O-O (0–1) | 1.475 |
| O-H (0–2) | 0.950 |
| O-H (1–3) | 0.950 |

| Ângulo | Graus |
|---|---:|
| O-O-H (1–0–2) | 94.8 |
| O-O-H (0–1–3) | 94.8 |

Diedro 2–0–1–3: 119.8°

## ethylene

Status: verified:false. Reescrita: não.

Planar · Double bond C=C · Ripening hormone

Átomos: C C H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.400 |
| C-H (1–2) | 1.140 |
| C-H (1–3) | 1.140 |
| C-H (0–4) | 1.140 |
| C-H (0–5) | 1.140 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–4) | 127.9 |
| C-C-H (1–0–5) | 127.9 |
| H-C-H (4–0–5) | 104.3 |
| C-C-H (0–1–2) | 127.9 |
| C-C-H (0–1–3) | 127.9 |
| H-C-H (2–1–3) | 104.3 |

Desvio do plano (0,1,2,3,4,5): 0.000

## acetylene

Status: ok. Reescrita: não.

Linear · Triple bond C≡C · Welding gas

Átomos: C C H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.200 |
| C-H (0–2) | 1.000 |
| C-H (1–3) | 1.000 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–2) | 180.0 |
| C-C-H (0–1–3) | 180.0 |

## formaldehyde

Status: verified:false. Reescrita: não.

Planar · Carbonyl C=O · Preservative

Átomos: C O H H

| Ligação | Comprimento |
|---|---:|
| C-O (0–1) | 1.300 |
| C-H (0–2) | 1.151 |
| C-H (0–3) | 1.151 |

| Ângulo | Graus |
|---|---:|
| O-C-H (1–0–2) | 124.4 |
| O-C-H (1–0–3) | 124.4 |
| H-C-H (2–0–3) | 111.2 |

Desvio do plano (0,1,2,3): 0.000

## co

Status: verified:false. Reescrita: não.

Linear · Triple bond · Toxic, odorless

Átomos: C O

| Ligação | Comprimento |
|---|---:|
| C-O (0–1) | 1.200 |

| Ângulo | Graus |
|---|---:|

## so2

Status: verified:false. Reescrita: sim.

Bent (119°) · Resonance · Air pollutant

Átomos: S O O

| Ligação | Comprimento |
|---|---:|
| S-O (0–1) | 1.431 |
| S-O (0–2) | 1.431 |

| Ângulo | Graus |
|---|---:|
| O-S-O (1–0–2) | 119.5 |

## hno3

Status: verified:false. Reescrita: sim.

Trigonal planar around N · Strong acid

Átomos: N O O O H

| Ligação | Comprimento |
|---|---:|
| N-O (0–1) | 1.210 |
| N-O (0–2) | 1.200 |
| N-O (0–3) | 1.410 |
| O-H (3–4) | 0.960 |

| Ângulo | Graus |
|---|---:|
| O-N-O (1–0–2) | 130.0 |
| O-N-O (1–0–3) | 115.0 |
| O-N-O (2–0–3) | 115.0 |
| N-O-H (0–3–4) | 102.0 |

Desvio do plano (0,1,2,3,4): 0.000

## propane

Status: verified:false. Reescrita: sim.

Alkane · 3 carbons · LPG fuel

Átomos: C C C H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.531 |
| C-C (1–2) | 1.531 |
| C-H (0–3) | 1.100 |
| C-H (0–4) | 1.100 |
| C-H (0–5) | 1.100 |
| C-H (1–6) | 1.100 |
| C-H (1–7) | 1.100 |
| C-H (2–8) | 1.100 |
| C-H (2–9) | 1.100 |
| C-H (2–10) | 1.100 |

| Ângulo | Graus |
|---|---:|
| C-C-H (1–0–3) | 111.0 |
| C-C-H (1–0–4) | 111.0 |
| C-C-H (1–0–5) | 111.0 |
| H-C-H (3–0–4) | 107.9 |
| H-C-H (3–0–5) | 107.9 |
| H-C-H (4–0–5) | 107.9 |
| C-C-C (0–1–2) | 113.8 |
| C-C-H (0–1–6) | 111.0 |
| C-C-H (0–1–7) | 111.0 |
| C-C-H (2–1–6) | 106.4 |
| C-C-H (2–1–7) | 106.4 |
| H-C-H (6–1–7) | 107.9 |
| C-C-H (1–2–8) | 111.0 |
| C-C-H (1–2–9) | 111.0 |
| C-C-H (1–2–10) | 111.0 |
| H-C-H (8–2–9) | 107.9 |
| H-C-H (8–2–10) | 107.9 |
| H-C-H (9–2–10) | 107.9 |

## cyclohexane

Status: ok. Reescrita: sim.

Cycloalkane · Chair conformation

Átomos: C C C C C C H H H H H H H H H H H H

| Ligação | Comprimento |
|---|---:|
| C-C (0–1) | 1.530 |
| C-C (1–2) | 1.530 |
| C-C (2–3) | 1.530 |
| C-C (3–4) | 1.530 |
| C-C (4–5) | 1.530 |
| C-C (5–0) | 1.530 |
| C-H (0–6) | 1.097 |
| C-H (0–7) | 1.097 |
| C-H (1–8) | 1.097 |
| C-H (1–9) | 1.097 |
| C-H (2–10) | 1.097 |
| C-H (2–11) | 1.097 |
| C-H (3–12) | 1.097 |
| C-H (3–13) | 1.097 |
| C-H (4–14) | 1.097 |
| C-H (4–15) | 1.097 |
| C-H (5–16) | 1.097 |
| C-H (5–17) | 1.097 |

| Ângulo | Graus |
|---|---:|
| C-C-C (1–0–5) | 111.3 |
| C-C-H (1–0–6) | 109.7 |
| C-C-H (1–0–7) | 109.7 |
| C-C-H (5–0–6) | 108.4 |
| C-C-H (5–0–7) | 108.4 |
| H-C-H (6–0–7) | 109.2 |
| C-C-C (0–1–2) | 111.3 |
| C-C-H (0–1–8) | 109.7 |
| C-C-H (0–1–9) | 109.7 |
| C-C-H (2–1–8) | 108.4 |
| C-C-H (2–1–9) | 108.4 |
| H-C-H (8–1–9) | 109.2 |
| C-C-C (1–2–3) | 111.3 |
| C-C-H (1–2–10) | 109.7 |
| C-C-H (1–2–11) | 109.7 |
| C-C-H (3–2–10) | 108.4 |
| C-C-H (3–2–11) | 108.4 |
| H-C-H (10–2–11) | 109.2 |
| C-C-C (2–3–4) | 111.3 |
| C-C-H (2–3–12) | 109.7 |
| C-C-H (2–3–13) | 109.7 |
| C-C-H (4–3–12) | 108.4 |
| C-C-H (4–3–13) | 108.4 |
| H-C-H (12–3–13) | 109.2 |
| C-C-C (3–4–5) | 111.3 |
| C-C-H (3–4–14) | 109.7 |
| C-C-H (3–4–15) | 109.7 |
| C-C-H (5–4–14) | 108.4 |
| C-C-H (5–4–15) | 108.4 |
| H-C-H (14–4–15) | 109.2 |
| C-C-C (4–5–0) | 111.3 |
| C-C-H (4–5–16) | 109.7 |
| C-C-H (4–5–17) | 109.7 |
| C-C-H (0–5–16) | 108.4 |
| C-C-H (0–5–17) | 108.4 |
| H-C-H (16–5–17) | 109.2 |

Diedro 0–1–2–3: 55.3°

Desvio do plano (0,1,2,3,4,5): 0.231

## hcn

Status: ok. Reescrita: não.

Linear · Triple C≡N · Toxic, almond odor

Átomos: H C N

| Ligação | Comprimento |
|---|---:|
| H-C (0–1) | 0.800 |
| C-N (1–2) | 1.000 |

| Ângulo | Graus |
|---|---:|
| H-C-N (0–1–2) | 180.0 |

## cs2

Status: ok. Reescrita: não.

Linear · Double C=S · Industrial solvent

Átomos: S C S

| Ligação | Comprimento |
|---|---:|
| S-C (0–1) | 1.200 |
| C-S (1–2) | 1.200 |

| Ângulo | Graus |
|---|---:|
| S-C-S (0–1–2) | 180.0 |

## pcl3

Status: verified:false. Reescrita: sim.

Trigonal pyramidal · Lewis acid

Átomos: P Cl Cl Cl

| Ligação | Comprimento |
|---|---:|
| P-Cl (0–1) | 2.040 |
| P-Cl (0–2) | 2.040 |
| P-Cl (0–3) | 2.040 |

| Ângulo | Graus |
|---|---:|
| Cl-P-Cl (1–0–2) | 100.3 |
| Cl-P-Cl (1–0–3) | 100.3 |
| Cl-P-Cl (2–0–3) | 100.3 |

## sf6

Status: ok. Reescrita: não.

Octahedral · Very stable · Electrical insulator

Átomos: S F F F F F F

| Ligação | Comprimento |
|---|---:|
| S-F (0–1) | 1.100 |
| S-F (0–2) | 1.100 |
| S-F (0–3) | 1.100 |
| S-F (0–4) | 1.100 |
| S-F (0–5) | 1.100 |
| S-F (0–6) | 1.100 |

| Ângulo | Graus |
|---|---:|
| F-S-F (1–0–2) | 180.0 |
| F-S-F (1–0–3) | 90.0 |
| F-S-F (1–0–4) | 90.0 |
| F-S-F (1–0–5) | 90.0 |
| F-S-F (1–0–6) | 90.0 |
| F-S-F (2–0–3) | 90.0 |
| F-S-F (2–0–4) | 90.0 |
| F-S-F (2–0–5) | 90.0 |
| F-S-F (2–0–6) | 90.0 |
| F-S-F (3–0–4) | 180.0 |
| F-S-F (3–0–5) | 90.0 |
| F-S-F (3–0–6) | 90.0 |
| F-S-F (4–0–5) | 90.0 |
| F-S-F (4–0–6) | 90.0 |
| F-S-F (5–0–6) | 180.0 |
