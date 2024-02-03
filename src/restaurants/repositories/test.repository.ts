import { CustomRepository } from 'src/typeorm/custom.repository.decorator';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@CustomRepository(Category)
export class TestRepository extends Repository<Category> {
  async test() {
    console.log(await this.find());
    console.log('test ok');
  }
}
