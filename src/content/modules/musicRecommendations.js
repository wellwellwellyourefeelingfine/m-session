/**
 * Music Recommendations for Music Immersion Module
 * Curated album selections suited to therapeutic sessions —
 * calming, instrumental or minimal-vocal, highly musical full albums.
 */

const _musicRecommendations = [
  {
    artist: 'Floating Points, Pharoah Sanders & LSO',
    title: 'Promises',
    description: 'Patient dialogue between electronic textures, saxophone, and orchestra. (46 min)',
    links: {
      spotify: 'https://open.spotify.com/album/3ShtO5VCYa3ctlR5uzLWBa',
      appleMusic: 'https://music.apple.com/us/search?term=Floating%20Points%20Pharoah%20Sanders%20Promises',
      youtube: 'https://www.youtube.com/results?search_query=Floating+Points+Pharoah+Sanders+Promises+full+album',
    },
  },
  {
    artist: 'Nala Sinephro',
    title: 'Space 1.8',
    description: 'Modular synth and jazz harp unfolding slowly. Smooth and enveloping. (44 min)',
    links: {
      spotify: 'https://open.spotify.com/album/51HFfu3GhuXa4VUnlpJJy8',
      appleMusic: 'https://music.apple.com/us/search?term=Nala%20Sinephro%20Space%201.8',
      youtube: 'https://www.youtube.com/results?search_query=Nala+Sinephro+Space+1.8+full+album',
    },
  },
  {
    artist: 'Photay & Carlos Niños',
    title: 'An Offering',
    description: 'Gentle electronic-acoustic ambient with harp flourishes. (36 min)',
    links: {
      spotify: 'https://open.spotify.com/album/38Mby80xycZFIVMwQN5BWw',
      appleMusic: 'https://music.apple.com/us/search?term=Photay%20Carlos%20Ni%C3%B1os%20An%20Offering',
      youtube: 'https://www.youtube.com/results?search_query=Photay+Carlos+Ni%C3%B1os+An+Offering+full+album',
    },
  },
  {
    artist: 'H Hunt',
    title: 'Playing Piano for Dad',
    description: 'Solo piano, spacious and unadorned. (35 min)',
    links: {
      spotify: 'https://open.spotify.com/album/3MjHsbM2kVdIlSq83MXOXi',
      appleMusic: 'https://music.apple.com/us/search?term=H%20Hunt%20Playing%20Piano%20for%20Dad',
      youtube: 'https://www.youtube.com/results?search_query=H+Hunt+Playing+Piano+for+Dad+full+album',
    },
  },
  {
    artist: 'Alabaster DePlume',
    title: 'To Cy & Lee: Instrumentals Vol. 1',
    description: 'Tender, rambling saxophone; warm and unhurried. (44 min)',
    links: {
      spotify: 'https://open.spotify.com/album/738vl88CQbSR5h0eckrIIg',
      appleMusic: 'https://music.apple.com/us/search?term=Alabaster%20DePlume%20To%20Cy%20%26%20Lee%20Instrumentals%20Vol%201',
      youtube: 'https://www.youtube.com/results?search_query=Alabaster+DePlume+To+Cy+%26+Lee+Instrumentals+Vol+1+full+album',
    },
  },
  {
    artist: 'Bonobo',
    title: 'Late Night Tales',
    description: 'Curated ambient and downtempo; includes Dustin O\'Halloran\'s piano work. (1hr 12min)',
    links: {
      spotify: 'https://open.spotify.com/album/75mOIzgjMsFLN5hyQlpsy8',
      appleMusic: 'https://music.apple.com/us/search?term=Bonobo%20Late%20Night%20Tales',
      youtube: 'https://www.youtube.com/results?search_query=Bonobo+Late+Night+Tales+full+album',
    },
  },
  {
    artist: 'Jon Hopkins',
    title: 'Music for Psychedelic Therapy',
    description: 'Designed explicitly for expanded states; no beats, only drift. (1hr 3min)',
    links: {
      spotify: 'https://open.spotify.com/album/2zY5p176SfmupXceLKT6bH',
      appleMusic: 'https://music.apple.com/us/search?term=Jon%20Hopkins%20Music%20for%20Psychedelic%20Therapy',
      youtube: 'https://www.youtube.com/results?search_query=Jon+Hopkins+Music+for+Psychedelic+Therapy+full+album',
    },
  },
  {
    artist: 'Caroline Shaw & Attacca Quartet',
    title: 'Orange',
    description: 'Pulitzer-winning composer\'s intimate string quartet writing. (1hr 3min)',
    links: {
      spotify: 'https://open.spotify.com/album/5d0tz2baP5WGhMzZvONcgU',
      appleMusic: 'https://music.apple.com/us/search?term=Caroline%20Shaw%20Attacca%20Quartet%20Orange',
      youtube: 'https://www.youtube.com/results?search_query=Caroline+Shaw+Attacca+Quartet+Orange+full+album',
    },
  },
  {
    artist: 'Arvo Pärt',
    title: 'Fratres (Kremer/Jarrett recording)',
    description: 'Tintinnabuli method at its most austere and beautiful. (55 min)',
    links: {
      spotify: 'https://open.spotify.com/album/3D3dLscRKfP5b9zIr0FED9',
      appleMusic: 'https://music.apple.com/us/search?term=Arvo%20P%C3%A4rt%20Fratres%20Kremer%20Jarrett',
      youtube: 'https://www.youtube.com/results?search_query=Arvo+P%C3%A4rt+Fratres+Kremer+Jarrett+full+album',
    },
  },
  {
    artist: 'Brian Eno',
    title: 'Apollo: Atmospheres and Soundtracks',
    description: 'Weightless ambient composed for NASA documentary footage. (49 min)',
    links: {
      spotify: 'https://open.spotify.com/album/1Km58i317Pm5bQR3wPHKcO',
      appleMusic: 'https://music.apple.com/us/search?term=Brian%20Eno%20Apollo%20Atmospheres%20and%20Soundtracks',
      youtube: 'https://www.youtube.com/results?search_query=Brian+Eno+Apollo+Atmospheres+and+Soundtracks+full+album',
    },
  },
  {
    artist: 'Keith Jarrett',
    title: 'The Köln Concert',
    description: 'Entirely improvised solo piano; one of the best-selling jazz recordings ever made. (1hr 6min)',
    links: {
      spotify: 'https://open.spotify.com/album/0I8vpSE1bSmysN2PhmHoQg',
      appleMusic: 'https://music.apple.com/us/search?term=Keith%20Jarrett%20The%20K%C3%B6ln%20Concert',
      youtube: 'https://www.youtube.com/results?search_query=Keith+Jarrett+The+K%C3%B6ln+Concert+full+album',
    },
  },
  {
    artist: 'Erik Satie',
    title: 'Gymnopédies (Pascal Rogé)',
    description: 'The original ambient music, from 1888. (1hr)',
    links: {
      spotify: 'https://open.spotify.com/album/7IjGFO75lb5ZP9ACSIjEAr',
      appleMusic: 'https://music.apple.com/us/search?term=Erik%20Satie%20Gymnop%C3%A9dies%20Pascal%20Rog%C3%A9',
      youtube: 'https://www.youtube.com/results?search_query=Erik+Satie+Gymnop%C3%A9dies+Pascal+Rog%C3%A9+full+album',
    },
  },
  {
    artist: 'Alice Coltrane',
    title: 'Journey in Satchidananda',
    description: 'Transcendent spiritual jazz with Pharoah Sanders on saxophone. (37 min)',
    links: {
      spotify: 'https://open.spotify.com/album/6zV55F6W8kh1qe8LHhqRbz',
      appleMusic: 'https://music.apple.com/us/search?term=Alice%20Coltrane%20Journey%20in%20Satchidananda',
      youtube: 'https://www.youtube.com/results?search_query=Alice+Coltrane+Journey+in+Satchidananda+full+album',
    },
  },
  {
    artist: 'Shabaka',
    title: 'Perceive Its Beauty, Acknowledge Its Grace',
    description: 'Meditative flute and collaboration with Floating Points and Laraaji. (46 min)',
    links: {
      spotify: 'https://open.spotify.com/album/6vIwPo3D1kZ3ZmlR1fyjm7',
      appleMusic: 'https://music.apple.com/us/search?term=Shabaka%20Perceive%20Its%20Beauty%20Acknowledge%20Its%20Grace',
      youtube: 'https://www.youtube.com/results?search_query=Shabaka+Perceive+Its+Beauty+Acknowledge+Its+Grace+full+album',
    },
  },
  {
    artist: 'Hiroshi Yoshimura',
    title: 'Music for Nine Post Cards',
    description: 'Japanese environmental music; deceptively simple synth compositions. (47 min)',
    links: {
      spotify: 'https://open.spotify.com/album/4h5av08hHhOyyINApKfnEE',
      appleMusic: 'https://music.apple.com/us/search?term=Hiroshi%20Yoshimura%20Music%20for%20Nine%20Post%20Cards',
      youtube: 'https://www.youtube.com/results?search_query=Hiroshi+Yoshimura+Music+for+Nine+Post+Cards+full+album',
    },
  },
  {
    artist: 'Gustav Mahler',
    title: 'Symphony No. 4 (Nézet-Séguin/Berlin Philharmonic)',
    description: 'His most pastoral and childlike symphony. (59 min)',
    links: {
      spotify: 'https://open.spotify.com/album/7tcW19BXX89ylKmpchhbTo',
      appleMusic: 'https://music.apple.com/us/search?term=Gustav%20Mahler%20Symphony%20No%204%20N%C3%A9zet-S%C3%A9guin%20Berlin%20Philharmonic',
      youtube: 'https://www.youtube.com/results?search_query=Gustav+Mahler+Symphony+No+4+N%C3%A9zet-S%C3%A9guin+Berlin+Philharmonic+full',
    },
  },
  {
    artist: 'Gustav Mahler',
    title: 'Symphony No. 9 (Karajan/Berlin Philharmonic)',
    description: 'His final completed symphony; a meditation on mortality. (1hr 25min)',
    links: {
      spotify: 'https://open.spotify.com/album/47EhDXxH1QRJtebEIwQ4NI',
      appleMusic: 'https://music.apple.com/us/search?term=Gustav%20Mahler%20Symphony%20No%209%20Karajan%20Berlin%20Philharmonic',
      youtube: 'https://www.youtube.com/results?search_query=Gustav+Mahler+Symphony+No+9+Karajan+Berlin+Philharmonic+full',
    },
  },
  {
    artist: 'John Luther Adams',
    title: 'Become Ocean',
    description: 'Pulitzer-winning orchestral piece that swells and recedes like tides. (42 min)',
    links: {
      spotify: 'https://open.spotify.com/album/14ZIOHQQEvOPR59Nkdl4ga',
      appleMusic: 'https://music.apple.com/us/search?term=John%20Luther%20Adams%20Become%20Ocean',
      youtube: 'https://www.youtube.com/results?search_query=John+Luther+Adams+Become+Ocean+full+album',
    },
  },
  {
    artist: 'John Luther Adams',
    title: 'Canticles of the Sky',
    description: 'Cello ensemble work; vast, slow, geological. (38 min)',
    links: {
      spotify: 'https://open.spotify.com/album/5aRIH8UJxQMuYAhGVDhLws',
      appleMusic: 'https://music.apple.com/us/search?term=John%20Luther%20Adams%20Canticles%20of%20the%20Sky',
      youtube: 'https://www.youtube.com/results?search_query=John+Luther+Adams+Canticles+of+the+Sky+full+album',
    },
  },
  {
    artist: 'Ravel / Monteux / Royal Philharmonic',
    title: 'Boléro; La valse; Pavane pour une infante défunte',
    description: 'Three of Ravel\'s most hypnotic orchestral works — the slow-building Boléro, the whirling La valse, and the tender Pavane. (34 min)',
    links: {
      spotify: 'https://open.spotify.com/album/2mYzRFjs3Kg8qPeB1kSgNS',
      appleMusic: 'https://music.apple.com/us/search?term=Ravel%20Bol%C3%A9ro%20La%20Valse%20Pavane%20Monteux%20Royal%20Philharmonic',
      youtube: 'https://www.youtube.com/results?search_query=Ravel+Bol%C3%A9ro+La+Valse+Pavane+Monteux+Royal+Philharmonic',
    },
  },
  {
    artist: 'Lautten Compagney',
    title: 'Timeless - Music by Merula and Glass',
    description: 'A mix of modern contemplative Philip Glass with the baroque genius of Tarquinio Merula. (1hr 9min)',
    links: {
      spotify: 'https://open.spotify.com/album/7fbtXYs5dYRjUpiIlRcrUN',
      appleMusic: 'https://music.apple.com/us/search?term=Lautten%20Compagney%20Timeless%20Merula%20Glass',
      youtube: 'https://www.youtube.com/results?search_query=Lautten+Compagney+Timeless+Music+by+Merula+and+Glass+full+album',
    },
  },
  {
    artist: 'Beethoven / Bernstein / New York Philharmonic',
    title: 'Symphony No. 3 "Eroica"',
    description: 'Beethoven\'s revolutionary third symphony — heroic, grieving, and triumphant — conducted by Bernstein at his most passionate. (1hr 4min)',
    links: {
      spotify: 'https://open.spotify.com/album/2NPiFjalwMMRuBz1H9NuPZ',
      appleMusic: 'https://music.apple.com/us/search?term=Beethoven%20Symphony%20No%203%20Eroica%20Bernstein%20New%20York%20Philharmonic',
      youtube: 'https://www.youtube.com/results?search_query=Beethoven+Symphony+No+3+Eroica+Bernstein+New+York+Philharmonic+full',
    },
  },
  {
    artist: 'Beethoven / Scharoun Ensemble',
    title: 'Septett, Op. 20 & Sextett, Op. 71',
    description: 'Early Beethoven at his most graceful — warm chamber music for strings and winds that radiates joy. (59 min)',
    links: {
      spotify: 'https://open.spotify.com/album/5dqOAsnYcp8IpCVXJ5C2ON',
      appleMusic: 'https://music.apple.com/us/search?term=Beethoven%20Septett%20Sextett%20Scharoun%20Ensemble',
      youtube: 'https://www.youtube.com/results?search_query=Beethoven+Septett+Op+20+Sextett+Op+71+Scharoun+Ensemble+full+album',
    },
  },
];

// Creator's pick — always appears last in the recommendations list
const creatorPick = {
  artist: 'Dasloops',
  title: '11evenwave',
  description: 'A song from the creator of this app :) enjoy!',
  links: {
    spotify: 'https://open.spotify.com/album/50Ee7CZjV3EybEsrREKYKv',
    appleMusic: 'https://music.apple.com/us/search?term=Dasloops%2011evenwave',
    youtube: 'https://www.youtube.com/results?search_query=Dasloops+11evenwave',
  },
};

export const musicRecommendations = [..._musicRecommendations, creatorPick];

/**
 * Get the default initial recommendations shown before the user refreshes.
 * Returns: Promises, Space 1.8, Symphony No. 9
 */
export function getInitialRecommendations() {
  return [
    musicRecommendations[0],  // Floating Points — Promises
    musicRecommendations[1],  // Nala Sinephro — Space 1.8
    musicRecommendations[16], // Gustav Mahler — Symphony No. 9
  ];
}

