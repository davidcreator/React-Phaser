"""Generate pixel-art vehicle spritesheets and runtime PNGs for the game.

The SVGs stay editable. If ImageMagick is available, matching transparent PNG
sheets are exported for Phaser (four 96x80 frames per car).
"""

from pathlib import Path
import shutil
import subprocess

OUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "sprites" / "cars"
FRAMES = 4
FRAME_W = 96
FRAME_H = 80
WHEEL_ANGLES = (0, 90, 180, 270)

CARS = {
    "fagulha": {
        "title": "Fagulha — picape de resgate",
        "body": "#d98732",
        "body_light": "#f3bd54",
        "body_shadow": "#9b4c27",
        "trim": "#252626",
        "glass": "#637777",
        "glass_light": "#b4c4b3",
        "accent": "#e6c75a",
        "rust": "#7c3f2c",
        "wheels": (23, 74),
        "body_svg": '''
          <!-- Tub, cab and bonnet: original rescue pickup silhouette. -->
          <path d="M5 52 L8 44 L17 42 L22 31 L31 22 L49 22 L57 32 L72 33 L80 27 L87 31 L91 41 L93 51 L91 57 L6 57 Z" fill="{body_shadow}" stroke="{trim}" stroke-width="3"/>
          <path d="M8 44 L18 42 L23 32 L31 25 L48 25 L54 34 L71 35 L79 30 L86 34 L89 43 L89 51 L8 51 Z" fill="{body}"/>
          <path d="M24 31 L32 23 L48 23 L56 33 L50 36 L27 36 Z" fill="{body_light}" stroke="{trim}" stroke-width="2"/>
          <path d="M31 27 L37 26 L43 26 L50 33 L31 33 Z" fill="{glass}" stroke="{trim}" stroke-width="2"/>
          <path d="M35 27 L39 27 L42 30 L38 30 Z M45 29 L48 32 H44 Z" fill="{glass_light}"/>
          <path d="M9 43 H20 V48 H8 Z M57 39 H74 V45 H57 Z" fill="{trim}"/>
          <path d="M12 45 H18 V47 H12 Z M60 41 H71 V43 H60 Z" fill="{body_light}"/>
          <path d="M54 37 V49 M22 35 L25 47" stroke="{trim}" stroke-width="2"/>
          <path d="M6 52 H90 V56 H6 Z" fill="{body_shadow}"/>
          <path d="M14 40 H18 V42 H14 Z M77 36 H81 V38 H77 Z M28 39 H31 V41 H28 Z" fill="{rust}"/>
          <path d="M13 47 H17 V49 H13 Z M48 45 H51 V47 H48 Z M82 47 H86 V49 H82 Z" fill="{body_light}"/>
          <path d="M88 41 H92 V45 H88 Z" fill="{accent}"/>
          <path d="M5 54 H15 V59 H5 Z M82 54 H93 V59 H82 Z" fill="{trim}"/>
        ''',
        "accessories": '''
          <rect x="10" y="36" width="10" height="6" fill="#4b463b" stroke="{trim}" stroke-width="2"/>
          <rect x="12" y="37" width="5" height="2" fill="#b28a4c"/>
          <rect x="18" y="30" width="3" height="10" fill="#c5a065"/>
          <rect x="13" y="32" width="3" height="4" fill="{rust}"/>
          <rect x="27" y="41" width="3" height="2" fill="#e4cf91"/>
          <rect x="38" y="43" width="3" height="2" fill="{rust}"/>
          <rect x="45" y="39" width="2" height="2" fill="#343a35"/>
          <rect x="79" y="47" width="3" height="2" fill="{rust}"/>
        ''',
    },
    "corisco": {
        "title": "Corisco — furgão de oficina",
        "body": "#618d7b",
        "body_light": "#8db39a",
        "body_shadow": "#36594e",
        "trim": "#232827",
        "glass": "#586d70",
        "glass_light": "#b9c9b6",
        "accent": "#e1c65c",
        "rust": "#74472e",
        "wheels": (22, 75),
        "body_svg": '''
          <!-- Boxy field van with tool lockers, not a branded ambulance. -->
          <path d="M5 52 V30 L12 21 H65 L72 27 L85 29 L91 40 V56 H5 Z" fill="{body_shadow}" stroke="{trim}" stroke-width="3"/>
          <path d="M9 49 V31 L15 24 H63 L69 31 V51 H9 Z" fill="{body}"/>
          <path d="M70 29 H83 L88 39 H70 Z" fill="{body_light}" stroke="{trim}" stroke-width="2"/>
          <path d="M72 31 H81 L85 38 H72 Z" fill="{glass}" stroke="{trim}" stroke-width="2"/>
          <path d="M74 32 H78 L82 37 H74 Z" fill="{glass_light}"/>
          <path d="M18 26 H34 V37 H15 V30 Z M38 26 H56 V37 H38 Z" fill="{glass}" stroke="{trim}" stroke-width="2"/>
          <path d="M20 27 H25 V29 H20 Z M42 27 H47 V29 H42 Z" fill="{glass_light}"/>
          <path d="M36 25 V52 M58 25 V51 M69 30 V52" stroke="{trim}" stroke-width="2"/>
          <path d="M11 39 H33 V49 H11 Z M39 40 H55 V49 H39 Z" fill="{body_shadow}" stroke="{trim}" stroke-width="2"/>
          <path d="M14 42 H30 V44 H14 Z M42 43 H52 V45 H42 Z" fill="{body_light}"/>
          <path d="M13 47 H29 M41 48 H52" stroke="{rust}" stroke-width="2"/>
          <path d="M5 52 H90 V56 H5 Z" fill="{trim}"/>
          <path d="M7 42 H10 V45 H7 Z M61 33 H65 V36 H61 Z M30 46 H33 V49 H30 Z" fill="{rust}"/>
          <path d="M86 40 H91 V45 H86 Z" fill="{accent}"/>
          <path d="M4 54 H13 V59 H4 Z M82 54 H92 V59 H82 Z" fill="{trim}"/>
        ''',
        "accessories": '''
          <path d="M17 18 H45 V20 H17 Z M21 16 H42 V18 H21 Z" fill="#b5a16e"/>
          <path d="M14 37 V49 M17 37 V49 M14 40 H17 M14 44 H17" stroke="#d0b785" stroke-width="1"/>
          <rect x="12" y="26" width="4" height="2" fill="{rust}"/>
          <rect x="60" y="42" width="5" height="5" fill="{accent}"/>
          <rect x="23" y="46" width="3" height="2" fill="{rust}"/>
          <rect x="48" y="46" width="4" height="2" fill="#d2b66d"/>
          <rect x="76" y="48" width="5" height="2" fill="{body_light}"/>
        ''',
    },
    "vaga-lume": {
        "title": "Vaga-Lume — buggy de trilha",
        "body": "#c2643f",
        "body_light": "#e28b55",
        "body_shadow": "#783b2e",
        "trim": "#222625",
        "glass": "#53696d",
        "glass_light": "#b5c5b5",
        "accent": "#f0cc63",
        "rust": "#604434",
        "wheels": (20, 77),
        "body_svg": '''
          <!-- Light trail buggy, exposed suspension and roll cage. -->
          <path d="M6 51 L13 43 L25 40 L32 33 L43 32 L50 39 L68 39 L76 34 L86 38 L92 47 L90 56 H7 Z" fill="{body_shadow}" stroke="{trim}" stroke-width="3"/>
          <path d="M10 49 L16 44 L26 42 L34 36 H43 L51 42 L69 42 L77 37 L84 40 L89 48 V52 H10 Z" fill="{body}"/>
          <path d="M31 36 L36 28 H51 L61 39 H51 L45 34 H38 L34 40 Z" fill="{trim}" stroke="{trim}" stroke-width="2"/>
          <path d="M38 30 H49 L56 37 H36 Z" fill="{glass}"/>
          <path d="M39 31 H43 L46 34 H39 Z" fill="{glass_light}"/>
          <path d="M31 28 L35 20 H57 L68 36 M35 20 L43 37 M57 20 L62 38" fill="none" stroke="{trim}" stroke-width="3"/>
          <path d="M34 22 H55 M41 19 H58" stroke="{body_light}" stroke-width="2"/>
          <path d="M10 51 H89 V56 H10 Z" fill="{trim}"/>
          <path d="M13 45 H19 V47 H13 Z M71 44 H77 V46 H71 Z M27 47 H30 V49 H27 Z" fill="{body_light}"/>
          <path d="M8 54 H18 V59 H8 Z M81 54 H92 V59 H81 Z" fill="{trim}"/>
          <path d="M88 43 H92 V47 H88 Z" fill="{accent}"/>
        ''',
        "accessories": '''
          <path d="M17 39 L22 36 L24 39 L20 42 Z M65 41 L69 38 L73 40 L70 43 Z" fill="{accent}"/>
          <path d="M14 44 L20 40 L23 42 L17 47 Z" fill="#393c36"/>
          <path d="M26 41 L28 38 L31 39 L29 44 Z M76 41 L78 38 L81 40 L79 44 Z" fill="#b18c58"/>
          <rect x="50" y="45" width="7" height="3" fill="{trim}"/>
          <rect x="37" y="40" width="2" height="3" fill="{glass_light}"/>
          <rect x="44" y="42" width="4" height="2" fill="{rust}"/>
        ''',
    },
    "aurora": {
        "title": "Aurora — caminhão de resgate",
        "body": "#c7a34f",
        "body_light": "#e3c36b",
        "body_shadow": "#79643c",
        "trim": "#222725",
        "glass": "#566c6c",
        "glass_light": "#bdc9b5",
        "accent": "#e9d482",
        "rust": "#69442e",
        "wheels": (18, 47, 78),
        "body_svg": '''
          <!-- Heavy evacuation truck with reinforced panels and field supplies. -->
          <path d="M4 52 V28 L10 20 H52 V17 H70 V25 H81 L88 33 L93 43 V56 H4 Z" fill="{body_shadow}" stroke="{trim}" stroke-width="3"/>
          <path d="M8 49 V29 L13 23 H49 V28 H67 V29 H80 L87 37 V52 H8 Z" fill="{body}"/>
          <path d="M12 24 H31 V37 H10 V29 Z M35 24 H49 V37 H35 Z" fill="{glass}" stroke="{trim}" stroke-width="2"/>
          <path d="M15 25 H21 V28 H15 Z M38 25 H43 V28 H38 Z" fill="{glass_light}"/>
          <path d="M32 22 V52 M52 18 V53 M68 27 V51" stroke="{trim}" stroke-width="2"/>
          <path d="M55 32 H65 V45 H55 Z M71 32 H83 V44 H71 Z" fill="{body_shadow}" stroke="{trim}" stroke-width="2"/>
          <path d="M57 35 H63 V37 H57 Z M73 35 H81 V37 H73 Z" fill="{body_light}"/>
          <path d="M11 41 H27 V48 H11 Z M55 47 H65 V50 H55 Z M72 46 H83 V50 H72 Z" fill="{trim}"/>
          <path d="M5 52 H92 V57 H5 Z" fill="{trim}"/>
          <path d="M9 44 H14 V46 H9 Z M29 46 H32 V49 H29 Z M78 29 H83 V32 H78 Z" fill="{rust}"/>
          <path d="M88 40 H93 V45 H88 Z" fill="{accent}"/>
          <path d="M3 54 H13 V60 H3 Z M83 54 H94 V60 H83 Z" fill="{trim}"/>
        ''',
        "accessories": '''
          <rect x="73" y="20" width="10" height="7" fill="{body_light}" stroke="{trim}" stroke-width="2"/>
          <rect x="75" y="21" width="3" height="2" fill="{accent}"/>
          <path d="M57 34 H63 V35 H57 Z M73 34 H79 V35 H73 Z" fill="#b8a478"/>
          <rect x="12" y="38" width="4" height="3" fill="{rust}"/>
          <rect x="19" y="43" width="3" height="2" fill="#d5bd73"/>
          <rect x="26" y="46" width="5" height="2" fill="{rust}"/>
          <rect x="40" y="41" width="2" height="2" fill="#e0c870"/>
          <rect x="54" y="46" width="3" height="2" fill="{rust}"/>
          <rect x="77" y="47" width="4" height="2" fill="#344239"/>
        ''',
    },
}


def wheel(cx: int, cy: int, angle: int, trim: str) -> str:
    # Octagonal tires and a simple hub make the rotation read clearly at game scale.
    return f'''
      <g shape-rendering="crispEdges">
        <path d="M{cx - 5} {cy - 10} H{cx + 5} L{cx + 9} {cy - 6} V{cy + 6} L{cx + 6} {cy + 10} H{cx - 6} L{cx - 10} {cy + 6} V{cy - 6} Z" fill="#292b29" stroke="#121615" stroke-width="2"/>
        <path d="M{cx - 7} {cy - 7} L{cx - 5} {cy - 9} H{cx + 5} L{cx + 8} {cy - 5} V{cy + 5} L{cx + 5} {cy + 8} H{cx - 5} L{cx - 8} {cy + 5} V{cy - 5} Z" fill="#554439"/>
        <path d="M{cx - 7} {cy - 5} H{cx - 5} V{cy - 1} H{cx - 7} Z M{cx + 5} {cy + 2} H{cx + 7} V{cy + 6} H{cx + 5} Z" fill="#81604a"/>
        <circle cx="{cx}" cy="{cy}" r="5" fill="#69706b" stroke="{trim}" stroke-width="2"/>
        <g transform="rotate({angle} {cx} {cy})" fill="#252b29" shape-rendering="crispEdges">
          <path d="M{cx - 1} {cy - 5} H{cx + 2} V{cy - 1} H{cx - 1} Z M{cx + 1} {cy} L{cx + 5} {cy + 2} L{cx + 4} {cy + 4} L{cx} {cy + 2} Z M{cx - 3} {cy} L{cx - 1} {cy + 2} L{cx - 4} {cy + 4} L{cx - 5} {cy + 2} Z"/>
          <rect x="{cx - 1}" y="{cy - 4}" width="2" height="2" fill="#d0b35a"/>
        </g>
        <rect x="{cx - 1}" y="{cy - 1}" width="3" height="3" fill="#c1b99a"/>
      </g>
    '''


def weapon(spec: dict) -> str:
    # A compact, fictional roof-mounted gun silhouette shared across the fleet.
    return f'''
      <g shape-rendering="crispEdges">
        <rect x="53" y="18" width="14" height="4" fill="{spec['trim']}"/>
        <rect x="57" y="14" width="5" height="5" fill="{spec['body_shadow']}" stroke="{spec['trim']}" stroke-width="1"/>
        <rect x="60" y="10" width="18" height="4" fill="#3b403c" stroke="{spec['trim']}" stroke-width="1"/>
        <rect x="76" y="9" width="7" height="5" fill="#535b53" stroke="{spec['trim']}" stroke-width="1"/>
        <rect x="81" y="10" width="3" height="3" fill="{spec['accent']}"/>
        <rect x="62" y="11" width="9" height="1" fill="#9ba18f"/>
      </g>
    '''


def frame(car_id: str, spec: dict, frame_index: int, angle: int) -> str:
    wheel_groups = "".join(wheel(cx, 64, angle, spec["trim"]) for cx in spec["wheels"])
    body = spec["body_svg"].format(**spec)
    accessories = spec["accessories"].format(**spec)
    return f'''
      <g transform="translate({frame_index * FRAME_W} 0)">
        <title>{spec['title']} — quadro {frame_index + 1}</title>
        <path d="M4 76 H92 V78 H4 Z" fill="#171a19" opacity=".52" shape-rendering="crispEdges"/>
        {wheel_groups}
        {body}
        {accessories}
        {weapon(spec)}
      </g>
    '''


def make_sheet(car_id: str, spec: dict) -> str:
    frames = "".join(frame(car_id, spec, index, angle) for index, angle in enumerate(WHEEL_ANGLES))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{FRAME_W * FRAMES}" height="{FRAME_H}" viewBox="0 0 {FRAME_W * FRAMES} {FRAME_H}" role="img" aria-labelledby="title desc" shape-rendering="crispEdges">
  <title id="title">{spec['title']} — spritesheet pixel art, 4 quadros</title>
  <desc id="desc">Veículo original em pixel art, vista lateral voltada para a direita, fundo transparente, quatro quadros de 96 por 80 pixels.</desc>
  {frames}
</svg>
'''


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rasterizer = shutil.which("magick") or shutil.which("convert")
    for car_id, spec in CARS.items():
        svg_path = OUT / f"{car_id}.svg"
        png_path = OUT / f"{car_id}.png"
        svg_path.write_text(make_sheet(car_id, spec), encoding="utf-8")
        if rasterizer:
            subprocess.run(
                [rasterizer, "-background", "none", str(svg_path), "-resize", f"{FRAME_W * FRAMES}x{FRAME_H}!", str(png_path)],
                check=True,
            )
    print(f"Generated {len(CARS)} editable pixel-art SVG spritesheets in {OUT}")
    if rasterizer:
        print("Rasterized matching transparent PNG sheets for the Phaser runtime.")
    else:
        print("ImageMagick is not installed; export the SVGs to matching PNGs before the Phaser runtime can load them.")


if __name__ == "__main__":
    main()
