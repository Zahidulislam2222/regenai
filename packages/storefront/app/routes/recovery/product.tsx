import {useLoaderData, type LoaderFunctionArgs, type MetaFunction} from 'react-router';
import {getDemoRecoveryProduct} from '~/features/recovery/framework-data';
import {ProductDetailView} from '~/features/recovery/Experience';
import {useRecoveryRouteMotion} from '~/features/recovery/route-motion';
import {RecoveryRouteErrorBoundary} from './error';

export {RecoveryRouteErrorBoundary as ErrorBoundary};

export async function loader({params}: LoaderFunctionArgs) {
  const product = getDemoRecoveryProduct(params.handle);
  if (!product) throw new Response(null, {status: 404});
  return {product};
}

export const meta: MetaFunction<typeof loader> = ({data}) => [
  {title: data ? `${data.product.name} — Recovery concept | RegenAI` : 'Product concept — RegenAI'},
  {name: 'description', content: data?.product.description ?? 'An original product design concept.'},
];

export default function RecoveryProductRoute() {
  const {product} = useLoaderData<typeof loader>();
  const {paused} = useRecoveryRouteMotion();
  return <ProductDetailView key={product.id} product={product} paused={paused} />;
}
