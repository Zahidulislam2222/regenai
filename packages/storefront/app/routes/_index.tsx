import type {MetaFunction} from 'react-router';
import {Hero} from '~/components/home/Hero';
import {TrustStrip} from '~/components/home/TrustStrip';
import {FeaturedCollections} from '~/components/home/FeaturedCollections';
import {ClinicianQuote} from '~/components/home/ClinicianQuote';
import {JsonLd, organizationSchema} from '~/lib/seo/jsonld';

export const meta: MetaFunction = () => [
  {title: 'RegenAI — clinician-grade recovery + sleep technology'},
  {
    name: 'description',
    content:
      'Evidence-backed recovery, sleep, and biomarker tools trusted by sports medicine clinicians. FDA-registered, CE-marked, clinician-reviewed.',
  },
  {property: 'og:title', content: 'RegenAI — clinician-grade recovery technology'},
  {property: 'og:type', content: 'website'},
  {property: 'og:description', content: 'Evidence-backed recovery, sleep, and biomarker tools.'},
  {name: 'twitter:card', content: 'summary_large_image'},
];

export default function HomeRoute() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <Hero />
      <TrustStrip />
      <FeaturedCollections />
      <ClinicianQuote />
    </>
  );
}
