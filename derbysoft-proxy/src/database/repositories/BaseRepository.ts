import { DeepPartial, MongoRepository } from "typeorm";
export class BaseRepository<T> extends MongoRepository<T> {
  public async mongoUpsert(entity: DeepPartial<T>, matchingFields: string[]) {
    let record;

    if (matchingFields.length) {
      // construct matching condition key value pairs from field names
      const matchingFieldValues = matchingFields.reduce((obj, field) => {
        // get nested values
        const nestedFields = field.split(".");
        const fieldValue = nestedFields.reduce((value, field) => value[field], entity);
        return { ...obj, [field]: fieldValue };
      }, {});

      record = await this.findOne(matchingFieldValues);
    }

    // if record already exists update it
    if (record) {
      const updatedRecord = this.merge(record, entity);
      return this.save(updatedRecord as DeepPartial<T>);
    } else {
      // record not found create it
      const newRecord = this.create(entity);
      return this.save(newRecord as DeepPartial<T>);
    }
  }
}
