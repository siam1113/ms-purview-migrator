export const dataMapper = (data: any) => {
  const mappedData = {
    caseName: data['CaseName'],
    name: data['Name'],
    custodianIds: data['CustodianIds'],
    issuingOfficer: data['IssuingOfficer'],
    recipients: {
      bcc: data['BccRecipients'],
      bccReissue: data['BccReissueRecipients'],
      bccRelease: data['BccReleaseRecipients'],
      cc: data['CcRecipients'],
      ccReissue: data['CcReissueRecipients'],
      ccRelease: data['CcReleaseRecipients']
    },
    contents: {
      escalation: data['EscalationContent'],
      hold: data['HoldContent'],
      issuance: data['IssuanceContent'],
      reissuance: data['ReissuanceContent'],
      release: data['ReleaseContent'],
      reminder: data['ReminderContent']
    },
    subjects: {
      escalation: data['EscalationSubject'],
      issuance: data['IssuanceSubject'],
      reissuance: data['ReissuanceSubject'],
      release: data['ReleaseSubject'],
      reminder: data['ReminderSubject'],
    },
    notifications: {
      escalation: {
        enabled: data['EscalationEnabled'],
        count: data['EscalationCount'],
        intervalInDays: data['EscalationIntervalInDays']
      },
      reminder: {
        enabled: data['ReminderEnabled'],
        count: data['ReminderCount'],
        intervalInDays: data['ReminderIntervalInDays']
      }
    },
    notificationType: data['NotificationType'],
    ackCount: data['AckCount'],
    createdDateTime: new Date(data['CreatedDateTime']).toISOString(),
    lastModifiedDateTime: new Date(data['LastModifiedDateTime']).toISOString(),
    status: data['Status'],
    statusLogs: Object.entries(JSON.parse(data['CustodianCommunicationStatus'])).flatMap(
      ([custodianId, status]: [string, any]) => {
        const log = [];

        if (status.lastEscalationDateTime! && status.lastEscalationDateTime !== "0001-01-01T00:00:00+00:00") {
          log.push({
            custodianId,
            type: "Escalation",
            datetime: status.lastEscalationDateTime,
            count: status.escalationCount
          });
        }

        if (status.lastReminderDateTime && status.lastReminderDateTime !== "0001-01-01T00:00:00+00:00") {
          log.push({
            custodianId,
            type: "Reminder",
            datetime: status.lastReminderDateTime,
            count: status.reminderCount
          });
        }

        if (status.acknowledgeDateTime && status.acknowledgeDateTime !== "0001-01-01T00:00:00+00:00") {
          log.push({
            custodianId,
            type: "Acknowledgedment",
            datetime: status.acknowledgeDateTime,
            count: 1
          });
        }

        if (status.releaseDateTime && status.releaseDateTime !== "0001-01-01T00:00:00+00:00") {
          log.push({
            _id: custodianId,
            type: "Release",
            datetime: status.releaseDateTime,
            count: 1
          });
        }

        return log;
      }
    )
  };

  return mappedData;
}