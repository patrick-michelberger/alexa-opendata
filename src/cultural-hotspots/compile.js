/*
 *  compile.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-11-18
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

const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
const unirest = require('unirest')
const yaml = require('js-yaml');
const Q = require('q');

const common = require("../../lib");

const _fix_name = (self, name) => {
    if (!name) {
        return null;
    }

    _.mapObject(_.d.first(self, "fix_name") || {}, (value, key) => {
        const key_re = new RegExp(key)
        name = name.replace(key_re, () => value);
    })

    return name;
}

// --
const _build = (_self, done) => {
    const self = _.d.clone.shallow(_self);

    self.itemds = _.d.list(self.data, "/features", [])
        .map(featured => {
            const itemd = _.d.compose.shallow({
                "_source": self.source,
                "name": _fix_name(self, _.d.first(featured, "properties/PNT_OF_INT", null)),
                "streetAddress": _.d.first(featured, "properties/LOCATION", null),
                "latitude": _.d.first(featured, "properties/LATITUDE", null),
                "longitude": _.d.first(featured, "properties/LONGITUDE", null),
            }, self.address)

            if (!itemd.name) {
                return;
            }

            // itemd._id = `urn:x-opendata:ca:on:toronto:pois:${_.id.slugify(itemd.streetAddress || "")}:${_.id.slugify(itemd.name)}`;
            itemd._id = [
                "urn",
                "x-opendata",
                _.id.slugify(self.address.addressCountry),
                _.id.slugify(self.address.addressRegion),
                _.id.slugify(self.address.addressLocality),
                self.source,
                _.id.slugify(itemd.streetAddress || ""),
                _.id.slugify(itemd.name),
            ].join(":")


            const category = _.d.first(featured, "properties/CATEGORY", null);
            const subcategories = _.d.list(self.subcategory, category, []).filter(c => c)
            if (_.is.Empty(subcategories)) {
                return;
            }

            itemd._theme = subcategories.map(s => `Cultural … ${ s }`)

            return itemd;
        })
        .filter(itemd => itemd);

    return done(null, self);
}
const _q_build = Q.denodeify(_build);
    
// -- put it altogether
const compile = (_self, done) => {
    const self = _.d.clone.shallow(_self);
    self.folder = __dirname;

    Q(self)
        .then(common.load_configuration)
        .then(common.load_data_from_file)
        // .then(common.load_data_from_url)
        .then(common.parse_json)
        .then(_q_build)
        .then(common.geocode_all)
        .then(self => done(null, self))
        .catch(error => done(error));
}

/**
 *  API / Main
 */
if (require.main === module) {
    common.main(compile);
}

exports.compile = compile;
