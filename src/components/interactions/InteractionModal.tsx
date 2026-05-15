import { Modal } from '../ui/Modal';
import InteractionForm from './InteractionForm';
import InteractionHistory from './InteractionHistory';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  soulId: string;
  shepherdId: string;
  soulName: string;
  sourceCollection?: 'souls' | 'evangelized_souls';
}

export default function InteractionModal({
  isOpen,
  onClose,
  soulId,
  shepherdId,
  soulName,
  sourceCollection = 'souls'
}: InteractionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Interactions avec ${soulName}`}
    >
      <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium text-[#00665C] mb-4">
                Nouvelle interaction
              </h3>
              <InteractionForm
                soulId={soulId}
                shepherdId={shepherdId}
                sourceCollection={sourceCollection}
                onSuccess={onClose}
                onClose={onClose}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-[#00665C] mb-4">
                Historique des interactions
              </h3>
              <InteractionHistory soulId={soulId} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
