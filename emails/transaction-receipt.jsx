import {
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
  Column,
  Link,
} from "@react-email/components";

export default function TransactionReceiptEmail({
  userName,
  amount,
  type,
  category,
  description,
  merchant,
  transactionId,
  timestamp,
  balanceBefore,
  balanceAfter,
  accountName,
}) {
  const isExpense = type === "EXPENSE";
  const amountDisplay = `Rs. ${amount.toLocaleString("en-IN")}`;
  const balanceBeforeDisplay = `Rs. ${balanceBefore.toLocaleString("en-IN")}`;
  const balanceAfterDisplay = `Rs. ${balanceAfter.toLocaleString("en-IN")}`;

  return (
    <Html>
      <Head />
      <Preview>
        {isExpense ? "Payment Received" : "Deposit Confirmed"} - InvestIQ
      </Preview>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Row>
            <Column>
              <Text style={logoStyle}>InvestIQ</Text>
            </Column>
          </Row>
        </Section>

        <Section style={bodyStyle}>
          <Text style={greetingStyle}>Hi {userName},</Text>
          
          <Text style={messageStyle}>
            Your {isExpense ? "payment" : "deposit"} has been{" "}
            <strong>successfully processed</strong>.
          </Text>

          <Section style={transactionBoxStyle}>
            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Transaction Type</Text>
                <Text style={valueStyle}>
                  {isExpense ? "Expense" : "Income"}
                </Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Amount</Text>
                <Text
                  style={{
                    ...valueStyle,
                    color: isExpense ? "#d32f2f" : "#388e3c",
                    fontSize: "24px",
                  }}
                >
                  {isExpense ? "-" : "+"}
                  {amountDisplay}
                </Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>From/To</Text>
                <Text style={valueStyle}>{merchant || "N/A"}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Category</Text>
                <Text style={valueStyle}>{category}</Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "100%" }}>
                <Text style={labelStyle}>Description</Text>
                <Text style={valueStyle}>{description || "No description"}</Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Account</Text>
                <Text style={valueStyle}>{accountName}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Transaction ID</Text>
                <Text style={valueStyle}>{transactionId}</Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Balance Before</Text>
                <Text style={valueStyle}>{balanceBeforeDisplay}</Text>
              </Column>
              <Column style={{ width: "50%" }}>
                <Text style={labelStyle}>Balance After</Text>
                <Text style={valueStyle}>{balanceAfterDisplay}</Text>
              </Column>
            </Row>

            <Hr style={dividerStyle} />

            <Row>
              <Column style={{ width: "100%" }}>
                <Text style={labelStyle}>Timestamp</Text>
                <Text style={valueStyle}>
                  {new Date(timestamp).toLocaleString("en-IN", {
                    dateStyle: "long",
                    timeStyle: "medium",
                  })}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
            </Text>
            <Text style={footerTextStyle}>
              Questions? Visit our{" "}
              <Link href="https://investiq.app" style={{ color: "#FF6B6B" }}>
                support center
              </Link>
            </Text>
          </Section>

          <Hr style={dividerStyle} />

          <Text style={disclaimerStyle}>
            This is an automated message. Please do not reply to this email.
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

const containerStyle = {
  backgroundColor: "#f9fafb",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#333",
};

const headerStyle = {
  backgroundColor: "#fff",
  padding: "20px 0",
  borderBottom: "1px solid #e5e7eb",
};

const logoStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#FF6B6B",
  margin: "0",
  padding: "0 20px",
};

const bodyStyle = {
  backgroundColor: "#fff",
  padding: "30px 20px",
};

const greetingStyle = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 10px 0",
};

const messageStyle = {
  fontSize: "14px",
  margin: "0 0 20px 0",
  color: "#666",
};

const transactionBoxStyle = {
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  margin: "0 0 5px 0",
};

const valueStyle = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  margin: "0 0 15px 0",
};

const dividerStyle = {
  borderColor: "#e5e7eb",
  margin: "15px 0",
};

const footerStyle = {
  padding: "20px 0",
  textAlign: "center",
};

const footerTextStyle = {
  fontSize: "13px",
  color: "#666",
  margin: "10px 0",
};

const disclaimerStyle = {
  fontSize: "12px",
  color: "#999",
  fontStyle: "italic",
  textAlign: "center",
  margin: "20px 0 0 0",
};
