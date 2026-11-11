import { MyTasksList } from "../MyTasks";

/** Cài đặt cá nhân › Thẻ: các thẻ được giao cho bạn ở mọi dự án. */
const CardsSettings = () => (
  <>
    <h1 className="text-3xl font-bold mb-2">Thẻ</h1>
    <p className="text-sm text-base-content/60 mb-8">Các thẻ được giao cho bạn ở mọi dự án.</p>
    <MyTasksList />
  </>
);

export default CardsSettings;
