function isOrgActor(user) {
  return ['org_admin', 'org_staff'].includes(user?.role);
}

function isGovActor(user) {
  return ['gov_admin', 'gov_analyst', 'government'].includes(user?.role);
}

function isSuperAdmin(user) {
  return user?.role === 'superadmin' || user?.role === 'super_admin';
}

function assertRole(condition, message = 'Forbidden') {
  if (condition) return;
  const error = new Error(message);
  error.statusCode = 403;
  throw error;
}

module.exports = {
  isOrgActor,
  isGovActor,
  isSuperAdmin,
  assertRole
};
