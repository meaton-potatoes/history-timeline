const NOW = 'NOW'
const ALL_ITEMS_IN_CATEGORY = 'ALL_ITEMS_IN_CATEGORY'

class Timeline {
  state = {
    settings: {
      filters: {
        areas: {},
        countries: {}
      },
      colorBasedOn: 'area',
      percentageOfPeople: 100
    },
    displayedPeople: [],
    ruler: {
      max: null,
      min: 1000000000
    },
    defaultFiltersLoaded: false,
    viewport: {}
  }

  constructor(container, people) {
    this.container = container
    this.availablePeople = people
  }

  applyFilters() {
    const { settings: { filters }, defaultFiltersLoaded } = this.state

    // reset years before finding ruler max and min
    this.state.ruler = {
      max: null,
      min: null
    }

    this.state.displayedPeople = []
    this.availablePeople.forEach(person => {
      // find default filters to save time on first loop
      if (!defaultFiltersLoaded) {
        filters.areas[person.type] = true
        filters.countries[person.country] = true
      }

      // if person fits filters
      if (filters.areas[person.type] && filters.countries[person.country]) {
        this.state.displayedPeople.push(person)

        // find ruler.max
        if (person.to == 0) {
          this.state.ruler.max = NOW
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

  renderSettings() {
    const { filters, colorsBasedOn, percentageOfPeople } = this.state.settings

    let html = $('<div></div>')
    Object.keys(filters).forEach(filterCategory => {
      if (filterCategory == 'areas') {
        html.append($('<h2>Areas of Interest</h2>'))
      } else if (filterCategory == 'countries') {
        html.append($('<h2>Countries of Origin</h2>'))
      }

      let div = $('<div></div>')
      let selectAll = $(`<span>Select All</span>`)
      selectAll.click(() => this.updateFilters(filterCategory, ALL_ITEMS_IN_CATEGORY, true))
      div.append(selectAll)
      div.append('<span> | </span>')
      let removeAll = $(`<span>Remove All</span>`)
      removeAll.click(() => this.updateFilters(filterCategory, ALL_ITEMS_IN_CATEGORY, false))
      div.append(removeAll)
      html.append(div)

      Object.keys(filters[filterCategory]).forEach(key => {
        let value = filters[filterCategory][key]
        let div = $('<div></div>')
        let keyCheckbox = $(`<input id='${filterCategory}-${key}' type='checkbox' ${value && 'checked'}></input>`)
        keyCheckbox.click(({ currentTarget: { checked } }) => this.updateFilters(filterCategory, key, checked))
        div.append(keyCheckbox)
        div.append($(`<label for='${filterCategory}-${key}'>${key}</label>`))
        html.append(div)
      })
    })
    $('#sidebar').html(html)
  }

  renderPeople() {
    const { displayedPeople, ruler } = this.state

    console.log(displayedPeople, ruler)
  }

  render(people) {
    this.applyFilters()
    this.renderSettings()
    this.renderPeople()
  }
}