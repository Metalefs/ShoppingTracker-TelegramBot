import { Db } from "mongodb";
import { BaseService } from "../../shared/models/base.service";

export class PurchasesService extends BaseService {
  constructor(protected dbconnection: Db) {
    super(dbconnection, "purchases");
  }
}
