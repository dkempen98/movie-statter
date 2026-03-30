const apiKey = import.meta.env.VITE_OMDB_API_KEY;

export async function movieAwards(imdbId, type = 'nominations') {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log(parseOscarNominations(data.Awards));
        return parseOscarNominations(data.Awards);
    } catch (error) {
        console.error('Error fetching OMDb data:', error);
        return 0;
    }
}

function parseOscarNominations(awardsString) {
    console.log(awardsString);
    if (!awardsString || awardsString === 'N/A') return 0;

    const match = awardsString.match(/(\d+)\s+nomination[s]?\s+for\s+(?:an\s+)?Oscar/i)
        ?? awardsString.match(/Nominated for\s+(\d+)\s+Oscar/i)
        ?? awardsString.match(/Won\s+(\d+)\s+Oscar/i);

    return match ? parseInt(match[1]) : 0;
}
