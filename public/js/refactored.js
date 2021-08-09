const CURRENT_YEAR = (new Date).getFullYear()
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
    people: {
      all: [],
      filtered: [],
      byYear: {}
    },
    ruler: {
      max: null,
      min: 1000000000
    },
    defaultFiltersLoaded: false,
    viewport: {}
  }

  constructor(container, people) {
    this.container = container
    this.state.people.all = people
  }

  applyFilters() {
    const { settings: { filters }, defaultFiltersLoaded } = this.state

    // reset years before finding ruler max and min
    this.state.ruler = {
      max: null,
      min: null
    }

    this.state.people.filtered = []
    this.state.people.all.forEach((person, i) => {
      // find default filters to save time on first loop
      if (!defaultFiltersLoaded) {
        filters.areas[person.type] = true
        filters.countries[person.country] = true
      }

      // if person fits filters
      if (filters.areas[person.type] && filters.countries[person.country]) {
        this.state.people.filtered.push(person)

        // organize filtered people by year
        for (let year = person.from; year < (person.to == 0 ? CURRENT_YEAR : person.to); year++) {
          this.state.people.byYear[year] = this.state.people.byYear[year] || []
          this.state.people.byYear[year].push(i)
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

      Object.keys(filters[filterCategory]).sort().forEach(key => {
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

  renderRuler() {
    const { ruler: { min, max } } = this.state

    this.table = $('<table></table>')
    let thead = $('<thead></thead>')
    for (let year = max; year > min; year--) {
      let th = $(`<th data-year=${year}>${year % 20 == 0 ? year : ''}</th>`)
      th.hover(({ currentTarget }) => {
        const year = $(currentTarget).data('year')
        const people = (this.state.people.byYear[year] || []).map(i => this.state.people.filtered[i].name)
        console.log(year, people)
      })
      thead.append(th)
    }
    this.table.append(thead)
    this.container.html(this.table)
  }

  renderPeople() {
    const { ruler, people: { filtered, byYear } } = this.state

    const rows = []
    Object.keys(byYear)
          .map(stringYear => parseInt(stringYear))
          .sort((a,b) => b - a)
          .forEach(year => {
            const peopleLivingInYear = byYear[String(year)]
            peopleLivingInYear.forEach((personIndex, i) => {
              // debugger
              let person = filtered[personIndex]
              rows[i] = rows[i] || $(`<tr data-row=${i}'></tr>`)

              // for (let blankCounter = year; blankCounter < ruler.max; blankCounter++){
              //   console.log(blankCounter, person)
              //   rows[i].append($(`<td data-year=${year}></td>`))
              // }
              rows[i].append($(`<td data-year=${year}>${person.name}</td>`))
            })
          })

    rows.forEach(row => {
      this.table.append(row)
    })
  }

  render(people) {
    this.applyFilters()
    this.renderSettings()
    this.renderRuler()
    this.renderPeople()
    console.log('done')
    window.state = this.state
  }
}