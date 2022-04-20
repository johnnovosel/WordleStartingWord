const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));

async function getWord(word) {
    try {
        const response = await fetch('https://api.datamuse.com/words?sp=' + word + '&md=f&max=1', {});
        let data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
        return null;
    }
}

getWord("then")



// https://api.datamuse.com/words?sp=smartass&md=f&max=1