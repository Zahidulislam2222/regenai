import {redirect, type LoaderFunctionArgs} from 'react-router';

export function loader(_args: LoaderFunctionArgs) {
  // Admin surface lands on the clinician review queue for Day 15 scope.
  // Future (D20+): check session, route to dashboard selector, etc.
  return redirect('/admin/reviews');
}
