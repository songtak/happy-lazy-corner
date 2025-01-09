import { create } from "zustand";
import { ModalInterface } from "@interfaces/componentInterface";

interface Props {
  /** Modal */
  isOpenModal: boolean;
  setOpenModal: (content: any, title?: string) => void;
  setCloseModal: () => void;
  modalContent: JSX.Element | undefined;
  /** Loading */
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}
const componentStore = create<Props>()((set) => ({
  /** ===[ Modal ]================================================================ */
  isOpenModal: false,
  modalTitle: undefined,
  modalContent: undefined,
  setOpenModal: (item: ModalInterface) => {
    set(() => ({
      isOpenModal: true,
      modalContent: item.content,
    }));
  },
  setCloseModal: () => {
    set(() => ({
      isOpenModal: false,
      modalContent: undefined,
      modalTitle: undefined,
    }));
  },
  /** ===[ Loading ]================================================================ */
  isLoading: false,
  setIsLoading: (isLoading) => {
    set(() => ({ isLoading: isLoading }));
  },
}));

export default componentStore;
