import TaskEscrowScreen from '@/components/TaskEscrowScreen';
import { EMPTY_TASK_ESCROW_SNAPSHOT, getTaskEscrowSnapshot } from '@/lib/server/taskEscrow';

type TasksPageProps = {
  searchParams?: Promise<{
    filter?: string;
    task?: string;
  }>;
};

const VALID_FILTERS = ['open', 'verifying', 'completed'] as const;

export default async function TasksPage({ searchParams }: TasksPageProps) {
  let initialData = EMPTY_TASK_ESCROW_SNAPSHOT;
  const params = await searchParams;
  const initialFilter = VALID_FILTERS.includes(params?.filter as (typeof VALID_FILTERS)[number])
    ? (params?.filter as (typeof VALID_FILTERS)[number])
    : 'open';
  const initialSelectedTaskId = params?.task ? Number(params.task) : null;

  try {
    initialData = await getTaskEscrowSnapshot();
  } catch (error) {
    console.error('Failed to prefetch task escrow snapshot:', error);
  }

  return (
    <TaskEscrowScreen
      initialData={initialData}
      initialFilter={initialFilter}
      initialSelectedTaskId={Number.isFinite(initialSelectedTaskId) ? initialSelectedTaskId : null}
    />
  );
}
