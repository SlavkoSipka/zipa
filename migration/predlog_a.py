"""
Predlog naslovne strane — verno po uzoru na pixsell.hr.

Ključno iz analize njihove stranice:
  · belo zaglavlje: meni lijevo, logotip u sredini, „Prijavi se" kao pilula desno
  · uska traka pretrage preko zatamnjene fotografije (oko 180 px)
  · fotografije bez razmaka, tri u redu, preko cijele širine ekrana
  · ogromni bijeli naslovi preko fotografija (60 px, debljina 800)
  · svijetlosiva pozadina #F4F5F7
"""
import json, datetime, html, urllib.parse, os

CDN = 'https://zipa-photos.zipa-photo-agency.workers.dev/photos'
podaci = json.load(open('podaci.json', encoding='utf-8'))
G, K = podaci['galerije'], podaci['kategorije']


def slika(p, v='700x'):
    return f"{CDN}/{v}/{urllib.parse.quote(p)}"


def datum(ts):
    return datetime.datetime.fromtimestamp(ts).strftime('%d.%m.%Y.') if ts else ''


def e(t):
    return html.escape(t or '')


STIL = """
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:#F4F5F7;color:#111318;
     font-family:-apple-system,system-ui,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;
     -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
a{text-decoration:none;color:inherit}
img{display:block;width:100%;height:100%;object-fit:cover}

/* napomena da je rijec o predlogu */
.napomena{background:#111318;color:#fff;font-size:12.5px;padding:9px 20px;text-align:center;
          letter-spacing:.01em}
.napomena b{color:#8fa6f5;font-weight:600}
.napomena a{color:#fff;text-decoration:underline;margin-left:12px;opacity:.85}

/* ── zaglavlje ─────────────────────────────────────────────── */
.zaglavlje{background:#fff;position:sticky;top:0;z-index:50;
           display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
           padding:16px 28px;box-shadow:0 1px 0 rgba(17,19,24,.07)}
.meni{display:flex;flex-direction:column;gap:5px;cursor:pointer;width:30px}
.meni i{height:2.5px;background:#111318;border-radius:2px;transition:transform .2s}
.meni:hover i:nth-child(2){transform:translateX(5px)}
.logo{justify-self:center;text-align:center;line-height:1}
.logo .ime{font-size:27px;font-weight:800;letter-spacing:-.045em;color:#111318}
.logo .ime span{color:#D8323F}
.logo .pod{font-size:8.5px;letter-spacing:.32em;color:#8b909c;margin-top:4px;font-weight:600}
.desno{justify-self:end;display:flex;align-items:center;gap:22px}
.desno .veza{font-size:14px;font-weight:500;color:#4a4f5a}
.prijava{border:1.5px solid #111318;border-radius:50px;padding:9px 24px;
         font-size:14px;font-weight:600;transition:all .18s}
.prijava:hover{background:#111318;color:#fff}

/* ── traka pretrage preko fotografije ──────────────────────── */
.pretraga-traka{position:relative;height:190px;display:flex;align-items:center;
                justify-content:center;padding:0 28px;overflow:hidden}
.pretraga-traka > img{position:absolute;inset:0;filter:brightness(.42) saturate(1.1)}
.pretraga-polje{position:relative;width:min(900px,100%);background:#fff;border-radius:50px;
                display:flex;align-items:center;padding:6px 6px 6px 28px;
                box-shadow:0 10px 40px rgba(0,0,0,.28)}
.pretraga-polje input{flex:1;border:0;outline:none;font-size:16.5px;padding:14px 0;
                      font-family:inherit;color:#111318;min-width:0}
.pretraga-polje input::placeholder{color:#9299a6}
.pretraga-polje .lupa{width:46px;height:46px;border-radius:50%;background:#F5A623;
                      display:grid;place-items:center;flex-shrink:0;cursor:pointer;
                      transition:background .18s}
.pretraga-polje .lupa:hover{background:#e09612}
.pretraga-polje .lupa svg{width:21px;height:21px;stroke:#fff;stroke-width:2.4;fill:none}

/* ── mozaik: fotografije bez razmaka, preko cijele širine ──── */
.mozaik{display:grid;grid-template-columns:repeat(3,1fr)}
.plocica{position:relative;aspect-ratio:3/2;overflow:hidden;background:#dfe2e8;display:block}
.plocica img{transform:scale(1.005);transition:transform .7s cubic-bezier(.2,.6,.2,1)}
.plocica:hover img{transform:scale(1.06)}
.plocica::after{content:"";position:absolute;inset:0;
                background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,0) 38%,rgba(0,0,0,.72) 100%);
                transition:opacity .3s}
.plocica:hover::after{opacity:.88}
.plocica .tekst{position:absolute;left:0;right:0;bottom:0;padding:26px 26px 24px;z-index:2}
.plocica .oznaka{display:inline-block;background:#D8323F;color:#fff;font-size:10.5px;
                 font-weight:700;letter-spacing:.06em;text-transform:uppercase;
                 padding:5px 11px;border-radius:3px;margin-bottom:11px}
.plocica h3{margin:0 0 8px;color:#fff;font-size:19px;line-height:1.22;font-weight:700;
            letter-spacing:-.018em;text-shadow:0 1px 14px rgba(0,0,0,.4)}
.plocica .sitno{display:flex;gap:14px;flex-wrap:wrap;color:rgba(255,255,255,.86);
                font-size:12.5px;font-weight:500}
.plocica .sitno span{display:inline-flex;align-items:center;gap:5px}

/* prva pločica preko dvije kolone i dva reda — isti odnos stranica,
   pa se mreža poklapa bez ijedne praznine */
.plocica.sira{grid-column:span 2;grid-row:span 2}
.plocica.sira .tekst{padding:34px 34px 30px}
.plocica.sira h3{font-size:38px;letter-spacing:-.03em;max-width:88%;margin-bottom:12px}
.plocica.sira .oznaka{font-size:11.5px;padding:6px 13px;margin-bottom:14px}
.plocica.sira .sitno{font-size:14px;gap:18px}

/* ── naslov odjeljka ───────────────────────────────────────── */
.odjeljak-vrh{display:flex;align-items:baseline;justify-content:space-between;
              padding:52px 28px 20px;max-width:1600px;margin:0 auto;gap:20px}
.odjeljak-vrh h2{margin:0;font-size:15px;font-weight:700;letter-spacing:.13em;
                 text-transform:uppercase;color:#111318}
.odjeljak-vrh a{font-size:13.5px;font-weight:600;color:#4a4f5a;white-space:nowrap;
                display:inline-flex;align-items:center;gap:6px;transition:gap .18s,color .18s}
.odjeljak-vrh a:hover{color:#111318;gap:11px}

/* ── kategorije: ogroman bijeli naslov preko fotografije ───── */
.kategorije{display:grid;grid-template-columns:repeat(2,1fr)}
.kategorija{position:relative;aspect-ratio:2/1;overflow:hidden;background:#dfe2e8;
            display:grid;place-items:center}
.kategorija img{position:absolute;inset:0;transform:scale(1.02);
                transition:transform .8s cubic-bezier(.2,.6,.2,1);filter:brightness(.58)}
.kategorija:hover img{transform:scale(1.08);filter:brightness(.5)}
.kategorija .naziv{position:relative;z-index:2;text-align:center;padding:0 24px}
.kategorija h3{margin:0;color:#fff;font-size:clamp(30px,4vw,60px);font-weight:800;
               letter-spacing:-.035em;line-height:1.02;
               text-shadow:0 2px 30px rgba(0,0,0,.45)}
.kategorija .broj{display:block;margin-top:12px;color:rgba(255,255,255,.9);
                  font-size:13px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}

/* ── podnožje ──────────────────────────────────────────────── */
.podnozje{background:#111318;color:#8b909c;margin-top:0}
.podnozje .sadrzaj{max-width:1600px;margin:0 auto;padding:52px 28px;
                   display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;
                   font-size:13.5px;line-height:1.7}
.podnozje .ime{color:#fff;font-size:20px;font-weight:800;letter-spacing:-.04em;margin-bottom:10px}
.podnozje .ime span{color:#D8323F}

@media (max-width:1100px){
  .mozaik{grid-template-columns:repeat(2,1fr)}
  .plocica.sira{grid-column:span 2;grid-row:span 1}
  .plocica.sira h3{font-size:28px;max-width:100%}
}
@media (max-width:680px){
  .mozaik,.kategorije{grid-template-columns:1fr}
  .plocica,.plocica.sira{grid-column:span 1;aspect-ratio:3/2}
  .plocica.sira h3{font-size:21px}
  .plocica h3{font-size:17px}
  .zaglavlje{grid-template-columns:auto 1fr auto;padding:14px 18px}
  .desno .veza{display:none}
  .pretraga-traka{height:150px;padding:0 18px}
  .pretraga-polje{padding-left:20px}
  .pretraga-polje input{font-size:15px}
  .odjeljak-vrh{padding:36px 18px 16px}
  .kategorija{aspect-ratio:16/9}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
"""

LUPA = ('<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">'
        '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/></svg>')

d = '<div class="sitno">'
telo = f"""
<div class="napomena">
  <b>Predlog izgleda naslovne strane</b> — po uzoru na pixsell.hr, sa fotografijama iz vaše arhive
  <a href="/radovi/">nazad na pregled radova</a>
</div>

<header class="zaglavlje">
  <div class="meni"><i></i><i></i><i></i></div>
  <a class="logo" href="#">
    <div class="ime">ZIPA<span>PHOTO</span></div>
    <div class="pod">PHOTO &nbsp;VIDEO &nbsp;DRON</div>
  </a>
  <div class="desno">
    <a class="veza" href="#">O nama</a>
    <a class="veza" href="#">Pomoć</a>
    <a class="prijava" href="#">Prijavi se</a>
  </div>
</header>

<section class="pretraga-traka">
  <img src="{slika(G[1]['slika'])}" alt="">
  <div class="pretraga-polje">
    <input placeholder="Pretražite arhivu od 202.411 fotografija…">
    <div class="lupa">{LUPA}</div>
  </div>
</section>

<div class="odjeljak-vrh">
  <h2>Najnovije objave</h2>
  <a href="#">Sve galerije <span>&rarr;</span></a>
</div>

<div class="mozaik">
"""

for i, g in enumerate(G[:9]):
    sira = ' sira' if i == 0 else ''
    telo += f"""  <a class="plocica{sira}" href="#">
    <img src="{slika(g['slika'], '700x')}" alt="">
    <div class="tekst">
      <span class="oznaka">{e(g['kategorija'] or 'Foto')}</span>
      <h3>{e(g['naziv'])}</h3>
      {d}<span>{e(g['lokacija'] or 'Banja Luka')}</span><span>{datum(g['datum'])}</span><span>{g['brojFotki']} fotografija</span></div>
    </div>
  </a>
"""

telo += """</div>

<div class="odjeljak-vrh">
  <h2>Izdvojene kategorije</h2>
  <a href="#">Sve kategorije <span>&rarr;</span></a>
</div>

<div class="kategorije">
"""

for k in K[:4]:
    if not k['galerije']:
        continue
    telo += f"""  <a class="kategorija" href="#">
    <img src="{slika(k['galerije'][0]['slika'], '700x')}" alt="">
    <div class="naziv">
      <h3>{e(k['naziv'])}</h3>
      <span class="broj">{k['broj']:,} fotografija</span>
    </div>
  </a>
""".replace(',', '.')

telo += """</div>

<footer class="podnozje">
  <div class="sadrzaj">
    <div>
      <div class="ime">ZIPA<span>PHOTO</span></div>
      Prvog krajiškog korpusa 58<br>78000 Banja Luka, Republika Srpska
    </div>
    <div>
      <b style="color:#fff">Kontakt</b><br>
      +387 66 00 11 22<br>info@zipaphoto.net
    </div>
    <div>
      <b style="color:#fff">Servis</b><br>
      202.411 fotografija<br>9.965 galerija · 62 fotografa
    </div>
  </div>
</footer>
"""

stranica = f"""<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>ZIPA PHOTO — predlog naslovne A</title>
<style>{STIL}</style>
</head>
<body>
{telo}
</body>
</html>
"""

izlaz = '/Users/Apple/Downloads/zipa/zipa24062026/site/public/radovi/predlog-a'
os.makedirs(izlaz, exist_ok=True)
open(f'{izlaz}/index.html', 'w', encoding='utf-8').write(stranica)
print('predlog A prerađen —', len(stranica), 'znakova')
