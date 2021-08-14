const CURRENT_YEAR = (new Date).getFullYear()
const ALL_ITEMS_IN_CATEGORY = 'ALL_ITEMS_IN_CATEGORY'
const COLORS = ["#E29EFF", "#5ee440", "#f25f10", "#f3c401", "#7088ed", "#e06394", "#5be0ad", "#be8058", "#709b32", "#52dbed", "#cb68cf", "#ec605a", "#c4cf8e", "#0398ce", "#a183b1", "#579c74", "#fcb1ef", "#b4d744", "#fe4878", "#eac56d", "#33a254", "#ef4db2", "#6e9592"]
const YEAR_WIDTH = 3
const PERSON_HEIGHT = 26

const yearLeftPixels = distanceFromNow => {
  return `${distanceFromNow * YEAR_WIDTH}px`
}

const yearWidthPixels = (years, item) => {
  if (item == 'person') {
    return `${(years * YEAR_WIDTH) - 5}px`
  }
  return `${years * YEAR_WIDTH}px`
}
const sampleArray = array => array[Math.floor(Math.random() * array.length)];

const initialState = {
  settings: {
    filters: {
      areas: {},
      countries: {}
    },
    colorBasedOn: 'area',
    percentageOfPeople: 100
  },
  people: {
    all: [],
    filteredByYear: {}
  },
  ruler: {
    max: null,
    min: null
  },
  defaultFiltersLoaded: false,
  viewport: {}
}

const logBenchmarks = (name, callback) => {
  const now = new Date()
  callback()
  console.log(name, new Date() - now)
}

class Timeline {
  state = initialState

  constructor(container, people) {
    this.container = container
    this.state.people.all = people
  }

  filterPeople() {
    const { settings: { filters }, defaultFiltersLoaded } = this.state

    // reset years before finding ruler max and min
    this.state.ruler = { max: null, min: null }

    // reset 
    this.state.people.filteredByYear = {}

    this.state.people.all.forEach((person, i) => {
      // find default filters to save time on first loop
      if (!defaultFiltersLoaded) {
        filters.areas[person.type] = true
        filters.countries[person.country] = true
      }

      // if person fits filters
      if (filters.areas[person.type] && filters.countries[person.country]) {
        // this.state.people.filtered.push(person)

        // organize filtered people by year
        for (let year = person.from; year < (person.to == 0 ? CURRENT_YEAR : person.to); year++) {
          this.state.people.filteredByYear[year] = this.state.people.filteredByYear[year] || []
          this.state.people.filteredByYear[year].push(person)
        }

        // find ruler.max
        if (person.to == 0) {
          this.state.ruler.max = CURRENT_YEAR
        } else if (!this.state.ruler.max || person.to > this.state.ruler.max) {
          this.state.ruler.max = person.to
        }

        // find ruler.min
        if (!this.state.ruler.min || person.from < this.state.ruler.min) {
          this.state.ruler.min = person.from
        }
      }
    })

    this.state.defaultFiltersLoaded = true
  }

  updateFilters(filterCategory, key, value) {
    if (key == ALL_ITEMS_IN_CATEGORY) {
      const { settings: { filters } } = this.state
      Object.keys(filters[filterCategory]).forEach(key => {
        this.state.settings.filters[filterCategory][key] = value
      })
    } else {
      this.state.settings.filters[filterCategory][key] = value
    }

    this.render()
  }

  renderSidebar() {
    const { filters, colorsBasedOn, percentageOfPeople } = this.state.settings

    let html = $('<div></div>')
    Object.keys(filters).forEach(filterCategory => {
      if (filterCategory == 'areas') {
        html.append($('<h2>Areas of Interest</h2>'))
      } else if (filterCategory == 'countries') {
        html.append($('<h2>Countries of Origin</h2>'))
      }

      const div = $('<div></div>')
                    .append($(`<span>Select All</span>`).click(() => this.updateFilters(filterCategory, ALL_ITEMS_IN_CATEGORY, true)))
                    .append('<span> | </span>')
                    .append($(`<span>Remove All</span>`).click(() => this.updateFilters(filterCategory, ALL_ITEMS_IN_CATEGORY, false)))
      html.append(div)

      Object.keys(filters[filterCategory]).sort().forEach(key => {
        const value = filters[filterCategory][key]
        const keyCheckbox = $(`<input id='${filterCategory}-${key}' type='checkbox' ${value && 'checked'}></input>`).click(({ currentTarget: { checked } }) => this.updateFilters(filterCategory, key, checked))
        const div = $('<div></div>').append(keyCheckbox).append($(`<label for='${filterCategory}-${key}'>${key}</label>`))
        html.append(div)
      })
    })
    $('#sidebar').html(html)
  }

  renderRuler() {
    const { ruler: { min, max } } = this.state

    let rulerElement = $('#ruler')
    rulerElement.empty()
    for (let year = max; year > min; year--) {
      const showTick = year % 20 == 0
      const yearMark = $(`<div class='year ${showTick ? 'tick' : ''}' data-year=${year}>${showTick ? year : ' '}</div>`).css({left: yearLeftPixels((max - year), 'year-tick'), width: yearWidthPixels(1)})
      rulerElement.append(yearMark)
    }
    rulerElement.css({ width: `${(max - min) * YEAR_WIDTH}px` })
  }

  generateChart() {
    const { ruler: { min, max }, people: { filteredByYear, all } } = this.state

    let rowTracker = []
    const personTopPixels = (death, birth) => {
      for (let i = 0; i <= rowTracker.length; i++) {
        if (!rowTracker[i] || rowTracker[i] > death) {
          rowTracker[i] = birth
          return `${25 + (PERSON_HEIGHT * i)}px`
        }
      } 
    }

    let chartElement = $('#chart')
    chartElement.empty()
    let alreadyDrawn = {}
    for (let year = max; year > min; year--) {
      const people = filteredByYear[year] || []
      people.forEach(({ name, link, to, from: birth }) => {
        if (alreadyDrawn[name]) {
          return false
        }

        const death = (to == 0 ? CURRENT_YEAR : to)
        const lifespan = death - birth
        const color = sampleArray(COLORS)
        const tile = $(`<div class='person'>${name}</div>`)
                  .click(() => window.open(link, '_blank'))
                  .css({
                    left: yearLeftPixels(max - death),
                    top: personTopPixels(death, birth),
                    width: yearWidthPixels(lifespan, 'person'),
                    'background-color': color
                  })
        chartElement.append(tile)
        alreadyDrawn[name] = true
      })
    }
  }

  // renderChart() {
  //   const { people: { filtered } } = this.state

  //   // let rowTracker = []
  //   // const personTopPixels = ({ to: death, from: birth }) => {
  //   //   let multiplier = 0
  //   //   debugger
  //   //   return `${25 + (PERSON_HEIGHT * multiplier)}px`
  //   // }

  //   let chartElement = $('#chart')
  //   chartElement.empty()
  //   filtered.forEach(person => {
  //     const death = person.to == 0 ? CURRENT_YEAR : person.to
  //     const lifespan = death - person.from
  //     const color = sampleArray(COLORS)
  //     const tile = $(`<div class='person'>${person.name}</div>`)
  //                 .click(() => window.open(person.link, '_blank'))
  //                 .css({
  //                   left: yearLeftPixels(death),
  //                   width: yearWidthPixels(lifespan),
  //                   'background-color': color,
  //                   height: `18px`,
  //                   overflow: 'scroll'
  //                 })
  //                 .data('birth', person.from)
  //                 .data('death', death)
  //                 .data('lifespan', lifespan)
      
  //     chartElement.append(tile)
  //   })
  // }

  render(people) {
    logBenchmarks('filterPeople', () => this.filterPeople())
    logBenchmarks('renderSidebar', () => this.renderSidebar())
    logBenchmarks('renderRuler', () => this.renderRuler())
    logBenchmarks('generateChart', () => this.generateChart())
    window.state = this.state
  }
}