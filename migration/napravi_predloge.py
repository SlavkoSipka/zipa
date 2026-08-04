"""Pravi dva predloga naslovne strane sa pravim ZIPA fotografijama."""
import json, datetime, html, urllib.parse

CDN = 'https://zipa-photos.zipa-photo-agency.workers.dev/photos'
podaci = json.load(open('podaci.json', encoding='utf-8'))
G = podaci['galerije']
K = podaci['kategorije']


def slika(putanja, velicina='700x'):
    return f"{CDN}/{velicina}/{urllib.parse.quote(putanja)}"


def datum(ts):
    if not ts:
        return ''
    return datetime.datetime.fromtimestamp(ts).strftime('%d.%m.%Y.')


def e(t):
    return html.escape(t or '')


ZAJEDNICKI_STIL = """
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
       color:#1a1d29;background:#fff;-webkit-font-smoothing:antialiased}
  a{text-decoration:none;color:inherit}
  img{display:block;width:100%;height:100%;object-fit:cover}
  .wrap{max-width:1280px;margin:0 auto;padding:0 24px}

  /* traka sa napomenom da je ovo predlog */
  .napomena{background:#1a1d29;color:#fff;font-size:13px;padding:10px 24px;text-align:center}
  .napomena b{color:#93a4ee}
  .napomena a{color:#fff;text-decoration:underline;margin-left:10px}
"""


def stranica(naslov, opis, telo, stil):
    return f"""<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{naslov}</title>
<style>{ZAJEDNICKI_STIL}{stil}</style>
</head>
<body>
<div class="napomena">
  <b>Predlog izgleda naslovne strane</b> — {opis}
  <a href="/radovi/">nazad na pregled radova</a>
</div>
{telo}
</body>
</html>
"""


# ─────────────────────────────────────────── PREDLOG A — po uzoru na Pixsell
stil_a = """
  .zaglavlje{display:flex;align-items:center;justify-content:space-between;
             padding:20px 24px;max-width:1280px;margin:0 auto}
  .meni-dugme{display:flex;flex-direction:column;gap:5px;cursor:pointer}
  .meni-dugme i{display:block;width:26px;height:2px;background:#1a1d29}
  .logo{font-size:24px;font-weight:800;letter-spacing:-.03em;color:#2f3fb5}
  .logo span{color:#d8323f}
  .prijava{border:1.5px solid #1a1d29;border-radius:99px;padding:9px 22px;
           font-size:14px;font-weight:600}

  .hero{position:relative;height:420px;overflow:hidden}
  .hero > img{position:absolute;inset:0;filter:brightness(.55)}
  .hero-sadrzaj{position:relative;height:100%;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:18px;padding:0 24px}
  .hero h1{color:#fff;font-size:clamp(26px,3.4vw,40px);margin:0;text-align:center;
           letter-spacing:-.02em;text-shadow:0 2px 20px rgba(0,0,0,.4)}
  .trazilica{display:flex;width:min(760px,100%);background:#fff;border-radius:99px;
             padding:7px 7px 7px 26px;align-items:center;box-shadow:0 8px 40px rgba(0,0,0,.25)}
  .trazilica input{flex:1;border:0;font-size:16px;padding:12px 0;outline:none;font-family:inherit}
  .trazilica button{background:#2f3fb5;color:#fff;border:0;border-radius:99px;
                    padding:13px 30px;font-size:15px;font-weight:600;cursor:pointer}
  .hero-brojevi{display:flex;gap:30px;color:#fff;font-size:13.5px;opacity:.95}
  .hero-brojevi b{font-size:17px;display:block;font-variant-numeric:tabular-nums}

  .odeljak-vrh{display:flex;align-items:baseline;justify-content:space-between;
               margin:52px 0 20px}
  .odeljak-vrh h2{font-size:22px;margin:0;letter-spacing:-.02em}
  .odeljak-vrh a{font-size:14px;color:#2f3fb5;font-weight:600}

  /* visina reda je fiksna, pa krupna kartica zauzme tacno dva reda —
     bez toga se razvlaci preko cele strane */
  .mozaik{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:215px;gap:14px}
  .kartica{position:relative;border-radius:12px;overflow:hidden;background:#eef0f5}
  .kartica.veliki{grid-column:span 2;grid-row:span 2}
  .kartica img{transition:transform .45s ease}
  .kartica:hover img{transform:scale(1.04)}
  .preliv{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.82) 100%)}
  .opis{position:absolute;left:0;right:0;bottom:0;padding:18px}
  .znacka{display:inline-block;background:#d8323f;color:#fff;font-size:11px;
          font-weight:700;padding:4px 10px;border-radius:5px;margin-bottom:8px}
  .opis h3{color:#fff;margin:0 0 6px;font-size:16px;line-height:1.25;letter-spacing:-.01em}
  .kartica.veliki .opis h3{font-size:24px}
  .meta{color:rgba(255,255,255,.82);font-size:12.5px;display:flex;gap:12px;flex-wrap:wrap}

  @media (max-width:900px){
    .mozaik{grid-template-columns:repeat(2,1fr);grid-auto-rows:180px}
    .kartica.veliki{grid-column:span 2;grid-row:span 1}
    .kartica.veliki .opis h3{font-size:19px}
    .hero{height:340px}
  }
  @media (max-width:560px){
    .mozaik{grid-template-columns:1fr;grid-auto-rows:200px}
    .kartica.veliki{grid-column:span 1}
  }
  footer{margin-top:70px;padding:40px 0;background:#1a1d29;color:#9aa1b4;font-size:13px}
"""

prva = G[0]
telo_a = f"""
<header class="zaglavlje">
  <div class="meni-dugme"><i></i><i></i><i></i></div>
  <div class="logo">ZIPA<span>PHOTO</span></div>
  <div class="prijava">Prijavi se</div>
</header>

<section class="hero">
  <img src="{slika(prva['slika'])}" alt="">
  <div class="hero-sadrzaj">
    <h1>Prva foto agencija u Bosni i Hercegovini</h1>
    <div class="trazilica">
      <input placeholder="Pretražite preko 200.000 fotografija…">
      <button>Pretraži</button>
    </div>
    <div class="hero-brojevi">
      <div><b>202.411</b> fotografija</div>
      <div><b>9.965</b> galerija</div>
      <div><b>62</b> fotografa</div>
    </div>
  </div>
</section>

<div class="wrap">
  <div class="odeljak-vrh">
    <h2>Najnovije fotografije</h2>
    <a href="#">Pogledajte sve galerije →</a>
  </div>
  <div class="mozaik">
"""
for i, g in enumerate(G[:10]):
    veliki = ' veliki' if i in (0, 5) else ''
    velicina = '700x' if veliki else '350x'
    telo_a += f"""    <a class="kartica{veliki}" href="#">
      <img src="{slika(g['slika'], velicina)}" alt="">
      <div class="preliv"></div>
      <div class="opis">
        <span class="znacka">{e(g['kategorija'] or 'Foto')}</span>
        <h3>{e(g['naziv'])}</h3>
        <div class="meta"><span>{e(g['lokacija'] or '')}</span><span>{datum(g['datum'])}</span><span>{g['brojFotki']} fotografija</span></div>
      </div>
    </a>
"""
telo_a += """  </div>
</div>
<footer><div class="wrap">ZIPA PHOTO AGENCY · Prvog krajiškog korpusa 58, Banja Luka · +387 66 00 11 22</div></footer>
"""

# ─────────────────────────────────────────── PREDLOG B — po uzoru na SPC
stil_b = """
  .traka-vrh{background:#2f3fb5;color:#fff;font-size:13px}
  .traka-vrh .wrap{display:flex;justify-content:space-between;align-items:center;height:38px}
  .traka-vrh a{opacity:.9}

  .zaglavlje{border-bottom:1px solid #e6e8ef}
  .zaglavlje .wrap{display:flex;align-items:center;justify-content:space-between;padding:18px 24px}
  .logo{font-size:23px;font-weight:800;letter-spacing:-.03em;color:#2f3fb5}
  .logo span{color:#d8323f}
  .nav{display:flex;gap:26px;font-size:14.5px;font-weight:600}
  .nav a.aktivan{color:#d8323f}
  .trazilica-mala{display:flex;background:#f5f6f9;border-radius:99px;padding:8px 8px 8px 18px;align-items:center}
  .trazilica-mala input{border:0;background:none;outline:none;font-size:14px;width:190px;font-family:inherit}
  .trazilica-mala button{background:#2f3fb5;color:#fff;border:0;border-radius:99px;padding:8px 18px;font-size:13.5px;font-weight:600;cursor:pointer}

  .odeljak{margin-top:46px}
  .naslov-odeljka{display:flex;align-items:center;gap:18px;margin-bottom:18px}
  .naslov-odeljka h2{font-size:21px;margin:0;letter-spacing:-.02em;white-space:nowrap}
  .naslov-odeljka .crta{flex:1;height:1px;background:#e6e8ef}
  .naslov-odeljka a{font-size:13.5px;color:#d8323f;font-weight:600;white-space:nowrap}

  .glavna{display:grid;grid-template-columns:1.9fr 1fr;gap:16px}
  .glavna-mala{display:grid;grid-template-rows:repeat(2,1fr);gap:16px}
  .stavka{position:relative;border-radius:10px;overflow:hidden;background:#eef0f5}
  .stavka.krupna{aspect-ratio:16/10}
  .stavka.sitna{aspect-ratio:16/9}
  .stavka img{transition:transform .4s ease}
  .stavka:hover img{transform:scale(1.03)}
  .preliv{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.85) 100%)}
  .opis{position:absolute;left:0;right:0;bottom:0;padding:16px 18px}
  .znacka{display:inline-block;background:#d8323f;color:#fff;font-size:10.5px;font-weight:700;
          padding:3px 9px;border-radius:4px;margin-bottom:7px;letter-spacing:.02em}
  .opis h3{color:#fff;margin:0 0 5px;font-size:15px;line-height:1.28}
  .stavka.krupna .opis h3{font-size:25px;letter-spacing:-.02em}
  .meta{color:rgba(255,255,255,.8);font-size:12px;display:flex;gap:11px;flex-wrap:wrap}

  .red4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .kartica-svetla{background:#fff;border:1px solid #e6e8ef;border-radius:10px;overflow:hidden}
  .kartica-svetla .slika{aspect-ratio:3/2;background:#eef0f5}
  .kartica-svetla .telo{padding:13px 15px 16px}
  .kartica-svetla h4{margin:0 0 7px;font-size:14.5px;line-height:1.32;letter-spacing:-.01em}
  .kartica-svetla .meta{color:#868c9c;font-size:12px;gap:10px}

  @media (max-width:980px){
    .glavna{grid-template-columns:1fr}
    .red4{grid-template-columns:repeat(2,1fr)}
    .nav{display:none}
  }
  @media (max-width:560px){ .red4{grid-template-columns:1fr} }
  footer{margin-top:70px;padding:40px 0;background:#1a1d29;color:#9aa1b4;font-size:13px}
"""

telo_b = f"""
<div class="traka-vrh"><div class="wrap">
  <span>ZIPA PHOTO AGENCY · Banja Luka</span>
  <span><a href="#">Pomoć</a> &nbsp;·&nbsp; <a href="#">Prijavi se</a> &nbsp;·&nbsp; <a href="#">Registruj se</a></span>
</div></div>

<header class="zaglavlje"><div class="wrap">
  <div class="logo">ZIPA<span>PHOTO</span></div>
  <nav class="nav">
    <a class="aktivan" href="#">Početna</a><a href="#">Galerije</a><a href="#">Kategorije</a>
    <a href="#">Fotografi</a><a href="#">Agencija</a>
  </nav>
  <div class="trazilica-mala"><input placeholder="Pretraga…"><button>Traži</button></div>
</div></header>

<div class="wrap">
  <div class="odeljak">
    <div class="naslov-odeljka"><h2>Najnovije</h2><div class="crta"></div><a href="#">Sve galerije →</a></div>
    <div class="glavna">
"""
g0 = G[0]
telo_b += f"""      <a class="stavka krupna" href="#">
        <img src="{slika(g0['slika'])}" alt="">
        <div class="preliv"></div>
        <div class="opis">
          <span class="znacka">{e(g0['kategorija'] or 'Foto')}</span>
          <h3>{e(g0['naziv'])}</h3>
          <div class="meta"><span>{e(g0['lokacija'] or '')}</span><span>{datum(g0['datum'])}</span><span>{g0['brojFotki']} fotografija</span><span>{e(g0['fotograf'] or '')}</span></div>
        </div>
      </a>
      <div class="glavna-mala">
"""
for g in G[1:3]:
    telo_b += f"""        <a class="stavka sitna" href="#">
          <img src="{slika(g['slika'], '350x')}" alt="">
          <div class="preliv"></div>
          <div class="opis">
            <span class="znacka">{e(g['kategorija'] or 'Foto')}</span>
            <h3>{e(g['naziv'])}</h3>
            <div class="meta"><span>{datum(g['datum'])}</span><span>{g['brojFotki']} fotografija</span></div>
          </div>
        </a>
"""
telo_b += """      </div>
    </div>
  </div>
"""

for k in K:
    if not k['galerije']:
        continue
    telo_b += f"""  <div class="odeljak">
    <div class="naslov-odeljka"><h2>{e(k['naziv'])}</h2><div class="crta"></div>
      <a href="#">{k['broj']:,} fotografija →</a></div>
    <div class="red4">
""".replace(',', '.')
    for g in k['galerije'][:4]:
        telo_b += f"""      <a class="kartica-svetla" href="#">
        <div class="slika"><img src="{slika(g['slika'], '350x')}" alt=""></div>
        <div class="telo">
          <h4>{e(g['naziv'])}</h4>
          <div class="meta"><span>{datum(g['datum'])}</span><span>{g['brojFotki']} fotografija</span></div>
        </div>
      </a>
"""
    telo_b += """    </div>
  </div>
"""

telo_b += """</div>
<footer><div class="wrap">ZIPA PHOTO AGENCY · Prvog krajiškog korpusa 58, Banja Luka · +387 66 00 11 22</div></footer>
"""

izlaz = '/Users/Apple/Downloads/zipa/zipa24062026/site/public/radovi'
import os
os.makedirs(f'{izlaz}/predlog-a', exist_ok=True)
os.makedirs(f'{izlaz}/predlog-b', exist_ok=True)

open(f'{izlaz}/predlog-a/index.html', 'w', encoding='utf-8').write(
    stranica('ZIPA PHOTO — predlog naslovne A', 'krupne fotografije i naglašena pretraga, u duhu Pixsell-a', telo_a, stil_a))
open(f'{izlaz}/predlog-b/index.html', 'w', encoding='utf-8').write(
    stranica('ZIPA PHOTO — predlog naslovne B', 'glavna vijest i sekcije po kategorijama, u duhu SPC-a', telo_b, stil_b))

print('napravljena dva predloga:')
print('  /radovi/predlog-a/  — Pixsell pristup')
print('  /radovi/predlog-b/  — SPC pristup')
