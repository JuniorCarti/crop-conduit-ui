function isOrgActor(user) {
  return user?.role === 'org_admin' || user?.role === 'org_staff';
}

function isGovActor(user) {
  return user?.role === 'gov_admin' || user?.role === 'gov_analyst';
}

function isSuperAdmin(user) {
  return user?.role === 'superadmin';
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

