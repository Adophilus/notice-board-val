// import { SaveFailError } from "@/models/Exceptions.js"

class Model {
  static idBase = "model:"
  static name = "Model"
  isNew = true

  constructor (db, { _id, _rev }) {
    this.db = db
    this.fields = {
      _id: this.idBase
    }

    if (_id) {
      this.isNew = false
      this.fields._id = _id
      this.fields._rev = _rev
    }
    this.__setProps()
  }

  __setProps () {
    // holder for custom `this.fields` props
  }

  static async count (db) {
    return (await this.get(db)).length
  }

  static async get (db, options = {}, raw = true, fields = [ "_id", "_rev" ]) {
    const { id, limit, where } = options

    // GET MODEL BY ID

    if (id) {
      // console.log(`${this.idBase}${id}`)
      let models = await db.find({
        selector: { _id: `${this.idBase}${id}` },
        fields: fields
      })

      if (raw) {
        return models.docs[0]
      }

      return models.docs
        .map((model) => new this(db, model))[0]
    }
    
    if (limit) {
      let models = await db.find({
        selector: { _id: { $regex: this.idBase } },
        fields: fields,
        limit
      })

      if (raw) {
        return models.docs
      }

      return models.docs
        .map((model) => new this(db, model))[0]
    }

    if (where) {
      let models = await db.find({
        selector: { ...where },
        fields: fields
      })

      if (raw) {
        return models.docs
      }

      return models.docs
        .map((model) => new this(db, model))
    }

    // GET ALL MODELS

    let models = await db.find({
      selector: { _id: { $regex: this.idBase } },
      fields: fields
    })

    if (raw) {
      return models.docs
    }

    return models.docs
      .map((model) => new this(db, model))
  }

  async generateId () {
    return Date.now()
  }

  set (fields) {
    this.fields = { ...this.fields, ...fields }
    return this
  }

  static remove (db, { _id, _rev }) {
    return db.remove(_id, _rev)
  }

  remove () {
    return this.db.remove(this.fields._id, this.fields._rev)
  }

  static split (id) {
    return id.split(this.idBase)[1]
  }

  static is (model) {
    if (model instanceof this) {
      return model.fields._id.startsWith(this.idBase)
    }
    else {
      return model._id.startsWith(this.idBase)
    }
  }

  async save () {
    let returnValue

    if (this.isNew) {
      this.fields._id = `${this.constructor.idBase}${await this.generateId()}`
      returnValue = await this.db.put(this.fields)
    }
    else {
      returnValue = await this.db.put(this.fields)
    }

    this.fields._rev = returnValue.rev
    this.isNew = false
    return this
  }
}

export default Model
