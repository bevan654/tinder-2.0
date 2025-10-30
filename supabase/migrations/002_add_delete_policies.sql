-- Add DELETE policies for unmatching functionality

-- Allow users to delete matches they are part of
CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Allow users to delete messages in their matches
CREATE POLICY "Users can delete messages in their matches"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Allow users to delete their own swipes (for unmatch feature)
CREATE POLICY "Users can delete own swipes"
  ON swipes FOR DELETE
  TO authenticated
  USING (auth.uid() = swiper_id);
