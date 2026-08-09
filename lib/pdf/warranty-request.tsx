import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1a202c" },
  header: { fontSize: 20, fontWeight: "bold", color: "#0a2540", marginBottom: 8 },
  subheader: { fontSize: 12, color: "#4a5568", marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "bold", color: "#0a2540", marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 140, color: "#4a5568" },
  value: { flex: 1, color: "#0a2540" },
  body: { marginTop: 12, lineHeight: 1.5 },
  footer: { marginTop: 24, fontSize: 9, color: "#718096" },
});

export function WarrantyRequestPDF({
  request,
}: {
  request: {
    generatedContent: string;
    requestedNextStep?: string | null;
    home: { address: string; builderName?: string | null };
    issue?: { title?: string; location?: string | null; dateNoticed?: Date | null; description?: string | null } | null;
  };
}) {
  const today = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.header}>New Home Warranty HQ</Text>
        <Text style={styles.subheader}>Warranty request prepared on {today}</Text>

        <Text style={styles.sectionTitle}>Property and builder</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>{request.home.address}</Text>
        </View>
        {request.home.builderName && (
          <View style={styles.row}>
            <Text style={styles.label}>Builder</Text>
            <Text style={styles.value}>{request.home.builderName}</Text>
          </View>
        )}

        {request.issue && (
          <>
            <Text style={styles.sectionTitle}>Issue</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Title</Text>
              <Text style={styles.value}>{request.issue.title || ""}</Text>
            </View>
            {request.issue.location && (
              <View style={styles.row}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{request.issue.location}</Text>
              </View>
            )}
            {request.issue.dateNoticed && (
              <View style={styles.row}>
                <Text style={styles.label}>Date first noticed</Text>
                <Text style={styles.value}>{new Date(request.issue.dateNoticed).toLocaleDateString()}</Text>
              </View>
            )}
          </>
        )}

        {request.requestedNextStep && (
          <>
            <Text style={styles.sectionTitle}>Requested next step</Text>
            <Text style={styles.body}>{request.requestedNextStep}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Request</Text>
        <Text style={styles.body}>{request.generatedContent}</Text>

        <Text style={styles.footer}>
          This is a homeowner-prepared request from New Home Warranty HQ. It does not determine coverage or create legal obligations.
        </Text>
      </Page>
    </Document>
  );
}
