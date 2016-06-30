module.exports = function (ci) {

  ci.config({
    secret: '12345',
  });

  //test.
  const test = ci.project('test', {
    repertory: 'git@10.211.55.8:houfeng/test.git'
  });

  test.job('PULLPR', function (self) {
    self.console.log(self.params);
    self.context.summary = `MR #${self.params.object_attributes.id},${self.params.object_attributes.source_branch}->${self.params.object_attributes.target_branch}`;
    done();
  });

};