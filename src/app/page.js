import { generateFrameMetadata } from './page-metadata';
import HomePage from '@/components/HomePage';

export async function generateMetadata(props) {
  return generateFrameMetadata(props);
}

export default function Page() {
  return <HomePage />;
}
