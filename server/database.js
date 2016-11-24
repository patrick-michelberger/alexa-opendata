/*
 *  database.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-11-24
 *
 *  The database of locations
 *
 *  Copyright [2013-2017] [David P. Janes]
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const iotdb = require('iotdb');
const _ = iotdb._;

const _theme_parts = theme => theme.split(" … ");

const _all_subthemes = theme => {
    const parts = _theme_parts(theme);

    const all_subparts = parts.reduce((accumulator, current) => {
        if (accumulator.length === 0) {
            return [ [ current ] ]
        } else {
            return accumulator.concat([ accumulator[accumulator.length - 1].concat([ current ]) ])
        }
    }, [])

    return all_subparts.map(subparts => subparts.join(" … "));
}

const _add_list = (ds, key, value) => {
    let s = ds[key]
    if (!s) {
        s = []
        ds[key] = s;
    }

    if (s.indexOf(value) === -1) {
        s.push(value)
    }
}

const database = () => {
    const self = Object.assign({});

    const _db_item = {};
    const _db_themes = {};
    const _db_theme_parts = {};
    const _db_names = {};

    self.add = _itemd => {
        const itemd = _.d.clone.deep(_itemd);
        
        const themes = _.d.list(itemd, "_theme")
        if (_.is.Empty(themes)) {
            console.log("warning: no _theme");
            return;
        }
        
        const id = _.d.first(itemd, "_id")
        if (_.is.Empty(id)) {
            console.log("warning: no _id");
            return;
        }
        
        const name = _.d.first(itemd, "name")
        if (_.is.Empty(name)) {
            console.log("warning: no name");
            return;
        }

        _db_item[id] = itemd;

        _add_list(_db_names, name, id);

        _.flatten(themes.map(_all_subthemes), true)
            .forEach(subtheme => _add_list(_db_themes, subtheme, id))

        _.flatten(themes.map(_theme_parts), true)
            .forEach(theme_part => _add_list(_db_theme_parts, theme_part, id));

    }

    self.get_by_id = id => {
    }

    self.list_by_theme = theme => {
    }

    self.list_by_name = name => {
    }

    self.dump = () => {
        console.log("+", "_db_names")
        console.log(JSON.stringify(_db_names, null, 2))
        console.log("+", "_db_themes")
        console.log(JSON.stringify(_db_themes, null, 2))
        console.log("+", "_db_theme_parts")
        console.log(JSON.stringify(_db_theme_parts, null, 2))
    }


    return self;
};

const db = database()
db.add({
    "_id": "urn:x-opendata:ca:on:toronto:parks:1865:facility:43258", 
    "_theme": [
      "Park \u2026 Sport Field",
      "Park \u2026 Garden"
    ], 
    "addressCountry": "CA", 
    "addressLocality": "Toronto", 
    "addressRegion": "ON", 
    "latitude": 43.7146723, 
    "longitude": -79.2806243, 
    "name": "Warden Hilltop Community Centre", 
    "postalCode": "M1L 0G6", 
    "streetAddress": "25 Mendelssohn St"
})

db.dump()
