
const getOptions = {
    method: 'GET',
    cache: 'no-store',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer ' + import.meta.env.VITE_TMDB_API_KEY
    }
};

function bust(url) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}_cb=${Date.now()}`;
}

async function fetchJson(url) {
    const response = await fetch(bust(url), getOptions);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    let text;
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        text = await new Response(stream).text();
    } else {
        text = new TextDecoder().decode(bytes);
    }

    return JSON.parse(text);
}

export async function movieSearch(searchString) {
    const encodedSearch = encodeURIComponent(searchString.trim());
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodedSearch}`;

    try {
        const data = await fetchJson(url);
        return data.results;
    } catch (error) {
        console.error('Error fetching movie data:', error);
    }
}

export async function movieCredits(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}/credits`;

    try {
        return await fetchJson(url);
    } catch (error) {
        console.error('Error fetching movie data:', error);
    }
}

export async function movieDetails(movieId) {
    const url = `https://api.themoviedb.org/3/movie/${movieId}`;

    try {
        return await fetchJson(url);
    } catch (error) {
        console.error('Error fetching movie data:', error);
    }
}

export async function personImages(personId) {
    const url = `https://api.themoviedb.org/3/person/${personId}/images`;

    try {
        return await fetchJson(url);
    } catch (error) {
        console.error('Error fetching movie data:', error);
    }
}
