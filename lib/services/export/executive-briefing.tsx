// One-page branded PDF briefing for the Executive / Minister.
// Uses @react-pdf/renderer. Brand colors form the header band (complex SVG seals
// don't render reliably in react-pdf, so we lead with the official name + palette).
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import * as React from 'react';

export interface BriefingData {
  countryName: string;
  classification: string;
  generatedAt: string;
  primary: string;
  secondary: string;
  kpis: { label: string; value: string }[];
  countries: { name: string; count: number; flag: string }[];
  age: { label: string; count: number }[];
  engagement: { returnInterest: number; investmentInterest: number };
}

export async function renderBriefing(data: BriefingData): Promise<Buffer> {
  const styles = StyleSheet.create({
    page: { backgroundColor: '#FFFFFF', paddingBottom: 40, fontSize: 10, color: '#1A2433' },
    band: { backgroundColor: data.primary, paddingVertical: 18, paddingHorizontal: 32 },
    bandTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 700 },
    bandSub: { color: '#FFFFFF', fontSize: 9, opacity: 0.85, marginTop: 3 },
    body: { paddingHorizontal: 32, paddingTop: 18 },
    sectionTitle: { fontSize: 8, letterSpacing: 1.5, color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    kpiRow: { flexDirection: 'row', gap: 10 },
    kpiCard: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, padding: 10 },
    kpiValue: { fontSize: 18, fontWeight: 700, color: data.primary },
    kpiLabel: { fontSize: 7, color: '#6B7280', textTransform: 'uppercase', marginTop: 2 },
    barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    barLabel: { width: 110, fontSize: 9 },
    barTrack: { flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 2 },
    barFill: { height: 8, backgroundColor: data.primary, borderRadius: 2 },
    barCount: { width: 40, fontSize: 9, textAlign: 'right' },
    twoCol: { flexDirection: 'row', gap: 24 },
    col: { flex: 1 },
    engageRow: { flexDirection: 'row', gap: 10 },
    engageCard: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, padding: 10, alignItems: 'center' },
    engageValue: { fontSize: 20, fontWeight: 700, color: data.primary },
    footer: { position: 'absolute', bottom: 18, left: 32, right: 32, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 7, color: '#9CA3AF' },
  });

  const countryMax = Math.max(1, ...data.countries.map((c) => c.count));
  const ageMax = Math.max(1, ...data.age.map((a) => a.count));

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          <Text style={styles.bandTitle}>Diaspora Intelligence Briefing</Text>
          <Text style={styles.bandSub}>{data.countryName} — {data.classification}</Text>
          <Text style={styles.bandSub}>Generated: {data.generatedAt}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.kpiRow}>
            {data.kpis.map((k) => (
              <View key={k.label} style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Top Host Countries</Text>
              {data.countries.map((c) => (
                <View key={c.name} style={styles.barRow}>
                  <Text style={styles.barLabel}>{c.name}</Text>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(c.count / countryMax) * 100}%` }]} /></View>
                  <Text style={styles.barCount}>{c.count}</Text>
                </View>
              ))}
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Age Distribution</Text>
              {data.age.map((a) => (
                <View key={a.label} style={styles.barRow}>
                  <Text style={styles.barLabel}>{a.label}</Text>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(a.count / ageMax) * 100}%`, backgroundColor: data.secondary }]} /></View>
                  <Text style={styles.barCount}>{a.count}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Engagement Signals</Text>
          <View style={styles.engageRow}>
            <View style={styles.engageCard}>
              <Text style={styles.engageValue}>{data.engagement.returnInterest}%</Text>
              <Text style={styles.kpiLabel}>Interest in Returning</Text>
            </View>
            <View style={styles.engageCard}>
              <Text style={styles.engageValue}>{data.engagement.investmentInterest}%</Text>
              <Text style={styles.kpiLabel}>Interest in Investing</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Prepared by Civis Sovereign Intelligence Platform · Afronovation, Inc.</Text>
          <Text style={styles.footerText}>{data.classification} — Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
