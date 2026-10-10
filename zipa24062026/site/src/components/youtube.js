import React, { Component } from 'react';

/*
 * YouTube — prepoznavanje oznake snimka i plejer koji se učitava tek na klik.
 *
 * Na strani /video stoji više snimaka u redu; ugrađeni YouTube plejer je
 * težak (preko 1 MB po snimku), pa se do klika prikazuje samo sličica sa
 * znakom za puštanje, a tek klik ubacuje pravi plejer (youtube-nocookie).
 */
export function youtubeId(link) {
    const s = String(link || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s; // goli ID
    const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

export class YouTubePlejer extends Component {
    constructor(props) {
        super(props);
        this.state = { pusten: false };
    }

    render() {
        const id = youtubeId(this.props.link);
        if (!id) return null;
        const naslov = this.props.naslov || 'YouTube';

        return (
            <div className="z-yt">
                {this.state.pusten ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
                        title={naslov}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <button type="button" className="z-yt__pokreni" onClick={() => this.setState({ pusten: true })}
                            aria-label={`${'Pusti snimak'.translate(this.props.lang)}: ${naslov}`}>
                        <img src={this.props.slicica || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
                        <span className="z-yt__znak" aria-hidden="true" />
                    </button>
                )}
            </div>
        );
    }
}
