import { supabase } from './supabase';

/**
 * Fetch emergency contacts for the current user
 */
export const getEmergencyContacts = async (userId) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });
  return { data, error };
};

/**
 * Add a new emergency contact
 */
export const addEmergencyContact = async (userId, contact) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone,
      is_primary: contact.is_primary || false,
    })
    .select()
    .single();
  return { data, error };
};

/**
 * Update emergency contact
 */
export const updateEmergencyContact = async (contactId, fields) => {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .update(fields)
    .eq('id', contactId)
    .select()
    .single();
  return { data, error };
};

/**
 * Log an emergency incident (severity, type, symptoms, result)
 */
export const logEmergencyIncident = async (userId, incident) => {
  const { data, error } = await supabase
    .from('emergency_incidents')
    .insert({
      user_id: userId,
      incident_type: incident.type,
      severity: incident.severity,
      symptoms: incident.symptoms,
      assessment_result: incident.assessmentResult,
      recommended_actions: incident.recommendedActions,
      ai_analysis: incident.aiAnalysis,
      location: incident.location,
    })
    .select()
    .single();
  return { data, error };
};

/**
 * Create or update a followup reminder
 */
export const saveFollowupReminder = async (userId, reminder) => {
  const { data, error } = await supabase
    .from('followup_reminders')
    .insert({
      user_id: userId,
      scheduled_for: reminder.scheduledFor,
      reminder_time: reminder.reminderTime,
      incident_id: reminder.incidentId,
      followup_type: reminder.followupType,
      notes: reminder.notes,
    })
    .select()
    .single();
  return { data, error };
};

/**
 * Get pending followup reminders
 */
export const getPendingReminders = async (userId) => {
  const { data, error } = await supabase
    .from('followup_reminders')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .order('scheduled_for', { ascending: true });
  return { data, error };
};

/**
 * Send SOS alert to all emergency contacts
 */
export const sendSOSAlert = async (userId, alertData) => {
  const { error } = await supabase
    .from('sos_alerts')
    .insert({
      user_id: userId,
      location: alertData.location,
      message: alertData.message,
      alert_time: new Date().toISOString(),
    });
  return { error };
};
