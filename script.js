const { API_KEY, API_BASE_URL, API_IMAGE_BASE_URL } = window._env_;

const discoverPath = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`
const searchPath = `${API_BASE_URL}/search/movie?&api_key=${API_KEY}&query=`

const main = document.getElementById("main")
const form = document.getElementById("form")
const search = document.getElementById("search")

const modal = document.getElementById('modal')
const modalContent = document.querySelector('.modal')

// cached requests (just so we save on those API requests)
let cachedResults = new Map()

document.querySelector('.modal-container').addEventListener('click', () => {
    modal.classList.remove('show')
})

document.querySelector('.modal').addEventListener('click', (e) => {
    e.stopPropagation()
    // prevents clicking through modal so user
    // has to click on dark overlay to leave popup
})

//#region Helpers

async function getMovies(url, page = 1) {
    const pathToFetch = url.concat(`&page=${page}`)

    const resp = await fetch(pathToFetch)
    const respData = await resp.json()

    const movies = respData.results

    cachedResults.set(url, movies)
    showMovies(movies)
}

function showMovies(movies) {
    let moviesParsed = movies.filter(item => !!item.poster_path)

    // generating 'ghost elements' incase a movie appears completely alone
    // which would cause the grid (minmax function) to say: only one item here
    // I will spread it accross the maximum width of this content pane, makes the movie stretched
    // while it should only keep to its column, which is why we generate based on the width of the screen
    // always some ghost elements that take up space (minimal) but are invisible 
    // (sample where this case appears 'vlaznost')
    const cards = Math.round(window.innerWidth / 400)
    moviesParsed = [...moviesParsed, ...generateGhostItems(cards)]

    main.innerHTML = ''

    moviesParsed.forEach((movie) => {
        const { poster_path, title, overview } = movie
        const poster = API_IMAGE_BASE_URL.concat(poster_path)

        const movieEl = document.createElement("div")

        movieEl.classList.add('movie')
        movieEl.classList.add(movie?.ghost??false ? 'ghost' : 'normal')

        // adding event listener for each movie being displayed
        movieEl.addEventListener('click', () => {
            showMovieDetails(poster, title, overview)
        })

        movieEl.style.backgroundImage = `url(${poster})`
        movieEl.style.backgroundSize = 'cover'

        main.appendChild(movieEl)
    })
}

function showMovieDetails(img, title, overview) {
    modal.classList.add('show')

    modalContent.innerHTML = `
        <img src="${img}" alt="${title}">
        <div class="info">
            <p class="title">${title}</p>
            <p>${overview}</p>
        </div>
    `
}

function handleScroll() {
    var offsetY = window.pageYOffset || document.documentElement.scrollTop

    if (offsetY >= 15) {
        search.classList.add('active')

    } else search.classList.remove('active')
}

function generateGhostItems(amount) {
    let arr = []

    for(i = 0; i < amount; i++) {
        arr.push({ ghost: true })
    }

    return arr
}

//#endregion

//#region Event Listeners

search.addEventListener('keydown', (event) => {

    if (event.key === 'Enter') {
        event.preventDefault()

        const searchTerm = search.value
        const constructedUrl = searchPath.concat(searchTerm)

        if (!searchTerm) {
            showMovies(cachedResults.get(discoverPath))
            return
        }

        if (cachedResults.has(constructedUrl)) {
            showMovies(cachedResults.get(constructedUrl))
            return
        }

        getMovies(constructedUrl)
    }
})

window.addEventListener('scroll', handleScroll)

//#endregion

getMovies(discoverPath, 1)