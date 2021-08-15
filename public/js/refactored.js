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

const sampleArray = array => array[Math.floor(Math.random() * array.length)]

const initialState = {
  settings: {
    filters: {
      areas: {},
      countries: {}
    },
    colorBasedOn: 'area',
    personProminence: 0
  },
  people: {
    all: [],
    filteredByYear: {},
    filteredCount: 0
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

  constructor(people) {
    this.state.people.all = people
  }

  filterPeople() {
    const { settings: { filters, personProminence }, defaultFiltersLoaded } = this.state

    // reset years before finding ruler max and min
    this.state.ruler = { max: null, min: null }

    // reset 
    this.state.people.filteredByYear = {}
    this.state.people.filteredCount = 0

    this.state.people.all.forEach((person, i) => {
      // find default filters to save time on first loop
      if (!defaultFiltersLoaded) {
        filters.areas[person.type] = true
        filters.countries[person.country] = true
      }

      // if person fits filters
      if (filters.areas[person.type] && filters.countries[person.country] && (person.rating * 100 >= personProminence)) {
        this.state.people.filteredCount++

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
    const { settings: { filters, colorsBasedOn, personProminence }, people: { filteredCount } } = this.state

    let sidebarElement = $('#sidebar')
    sidebarElement.empty()
    sidebarElement.append($('<h1>Settings</h1>'))
    sidebarElement.append($(`<label for="personProminence">Limit by Prominence</label>`))
    sidebarElement.append($(`<input id='personProminence' type="range" min="0" max="100" value="${personProminence}">`)
                            .change(({ currentTarget: { value } }) => {
                              this.state.settings.personProminence = value
                              this.render()
                            }))
    sidebarElement.append($(`<span class='muted'>${personProminence}% limit, showing ${filteredCount} people</span>`))
    Object.keys(filters).forEach(filterCategory => {
      if (filterCategory == 'areas') {
        sidebarElement.append($('<h2>Areas of Interest</h2>'))
      } else if (filterCategory == 'countries') {
        sidebarElement.append($('<h2>Countries of Origin</h2>'))
      }

      const div = $('<div></div>')
                    .append($(`<span class='cursor-pointer'>Select All</span>`).click(() => this.updateFilters(filterCategory, ALL_ITEMS_IN_CATEGORY, true)))
                    .append('<span> | </span>')
                    .append($(`<span class='cursor-pointer'>Remove All</span>`).click(() => this.updateFilters(filterCategory, ALL_ITEMS_IN_CATEGORY, false)))
      sidebarElement.append(div)

      Object.keys(filters[filterCategory]).sort().forEach(key => {
        const value = filters[filterCategory][key]
        const keyCheckbox = $(`<input id='${filterCategory}-${key}' type='checkbox' ${value && 'checked'}></input>`).click(({ currentTarget: { checked } }) => this.updateFilters(filterCategory, key, checked))
        const div = $('<div></div>').append(keyCheckbox).append($(`<label for='${filterCategory}-${key}'>${key}</label>`))
        sidebarElement.append(div)
      })
    })
  }

  renderRuler() {
    const { ruler: { min, max }, people: { filteredByYear } } = this.state

    let rulerElement = $('#ruler')
    rulerElement.empty()
    for (let year = max; year > min; year--) {
      const showTick = year % 20 == 0
      const yearMark = $(`<div class='year ${showTick ? 'tick' : ''}'></div>`)
                        .html(showTick ? year : ' ')
                        .css({left: yearLeftPixels((max - year), 'year-tick'), width: yearWidthPixels(1)})
      rulerElement.append(yearMark)
    }
    rulerElement
      .css({ width: `${(max - min) * YEAR_WIDTH}px` })
      .mousemove(({ pageX }) => {
        const year = Math.floor(CURRENT_YEAR - (pageX / YEAR_WIDTH))
        console.log(year, filteredByYear[String(year)])
      })
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
    let chartedPeople = {}
    for (let year = max; year > min; year--) {
      const people = filteredByYear[year] || []
      people.forEach(({ name, link, to, from: birth }) => {
        if (chartedPeople[name]) {
          return false
        }

        const death = (to == 0 ? CURRENT_YEAR : to)
        const color = sampleArray(COLORS)
        const personElement = $(`<div class='person'></div>`)
                                .html($(`<span>${name}</span>`).css({ 'background-color': color }))
                                .click(() => window.open(link, '_blank'))
                                .css({
                                  left: yearLeftPixels(max - death),
                                  top: personTopPixels(death, birth),
                                  width: yearWidthPixels((death - birth), 'person'),
                                  'background-color': color
                                })
        chartElement.append(personElement)
        chartedPeople[name] = true
      })
    }
  }

  render() {
    logBenchmarks('filterPeople', () => this.filterPeople())
    logBenchmarks('renderSidebar', () => this.renderSidebar())
    logBenchmarks('renderRuler', () => this.renderRuler())
    logBenchmarks('generateChart', () => this.generateChart())
  }
}